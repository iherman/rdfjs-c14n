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
        const [input, input_quads, expected] = await Promise.all([
            fs.readFile(input_fname, 'utf-8'),
            rdfn3.get_quads(input_fname),
            fs.readFile(expected_fname, 'utf-8'),
        ]);

        const canonicalizer    = new RDFCanon(rdfn3.DataFactory); 
        canonicalizer.set_logger(logger);
        const c14n_input = canonicalizer.canonicalize(input_quads);
        const c14n_nquads = rdfn3.dataset_to_nquads(c14n_input).sort().join('\n');

        console.log(`*********** Test number ${num} ***********`)
        console.log(`Input quads:\n${input}`);
        console.log(`Canonicalized quads:${c14n_nquads}\n`);
        console.log(`Expected quads:\n${expected}\n`);
        const test_passes = c14n_nquads.trim() === expected.trim() ? 'passes' : 'fails';
        console.log(`Test ${test_passes}`);
    } else {
        console.error('Invalid test number');
    }
}

main();
