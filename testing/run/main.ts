import { Command }               from 'commander';
import { RDFCanon, Quads, Hash } from '../../index';
import { SimpleLogger, Levels }  from './logger';
import * as rdfn3                from './rdfn3';
import {promises as fs}          from 'fs';

const test_number_format = RegExp('^[0-9][0-9][0-9]$');

function compare_nquads(left: string[], right: string[]): boolean {
    if (left.length !== right.length) {
        return false;
    } else {
        for (let index = 0; index < left.length; index++) {
            if (left[index] !== right[index]) {
                return false;
            }
        }
        return true;
    }
}

function print_quads(nquads: string[], label: string): void {
    console.log(`=== ${label}:`);
    for (const nquad of nquads) {
        console.log(nquad);
    }
    console.log('\n');
}

async function main(): Promise<void> {
    const test_number = (num ?: string): string => {
        if (num) {
            switch (num.length) {
                case 1:
                    return `00${num}`;
                case 2:
                    return `0${num}`;
                case 3:
                default:
                    return num;
            }
        } else {
            return "002"
        }
    };

    const program = new Command();
    program
        .name ('rdf_c14n [number]')
        .description('Run a specific test from the test suite')
        .usage('[options]')
        .option('-n --number [number]', 'Test number')
        .option('-d --debug', 'Display all log')
        .option('-t --trace', 'Display trace log')
        .parse(process.argv);

    const options = program.opts();
    const debug = options.debug ? true : false;
    const trace = options.trace ? true : false;

    const logLevel = (debug) ? Levels.debug : ((trace) ? Levels.info : Levels.error);
    const logger = new SimpleLogger(logLevel);

    const num = (program.args.length === 0) ? test_number(options.number) : test_number(program.args[0]);

    if (test_number_format.test(num)) {
        const input_fname    = `testing/tests/test${num}-in.nq`;
        const expected_fname = `testing/tests/test${num}-urdna2015.nq`
        const [input, expected] = await Promise.all([
            rdfn3.get_quads(input_fname),
            rdfn3.get_quads(expected_fname),
        ]);

        const canonicalizer    = new RDFCanon(rdfn3.DataFactory); 
        canonicalizer.set_logger(logger);
        const c14n_input = canonicalizer.canonicalize(input);

        const input_quads    = rdfn3.dataset_to_nquads(input).sort();
        const c14_quads      = rdfn3.dataset_to_nquads(c14n_input).sort();
        const expected_quads = rdfn3.dataset_to_nquads(expected).sort();

        console.log(`*************** Test number ${num} *****************`);
        print_quads(input_quads, 'Input quads');
        print_quads(c14_quads,'Canonicalized quads');
        print_quads(expected_quads,'Expected quads');

        const test_passes = compare_nquads(c14_quads,expected_quads) ? 'passes' : 'fails';
        console.log(`===> Test ${test_passes} <===`);

    } else {
        console.error('Invalid test number');
    }
}

main();
