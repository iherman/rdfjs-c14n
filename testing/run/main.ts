import { Command }               from 'commander';
import { RDFCanon, Quads, Hash } from '../../index';
import { SimpleLogger, Levels }  from './logger';
import * as rdfn3                from './rdfn3';

const number_of_tests: number = 62;
const extra_tests: string[] = ['900', '901']

// The format of all test numbers
const test_number_format = RegExp('^[0-9][0-9][0-9]$');

// Compare two quad array for equality.
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

// Print a single quad in a line
function print_quads(nquads: string[], label: string): void {
    console.log(`=== ${label}:`);
    for (const nquad of nquads) {
        console.log(nquad);
    }
    console.log('\n');
}

/**
 * Run a single test, optionally displaying the result
 * 
 * @param dump - whether the results should be printed on the screen
 */
async function single_test(canonicalizer: RDFCanon, num: string, dump: boolean = true): Promise<boolean> {
    const input_fname    = `testing/tests/test${num}-in.nq`;
    const expected_fname = `testing/tests/test${num}-urdna2015.nq`
    const [input, expected] = await Promise.all([
        rdfn3.get_quads(input_fname),
        rdfn3.get_quads(expected_fname),
    ]);

    const c14n_input = canonicalizer.canonicalize(input);
    const input_quads    = rdfn3.dataset_to_nquads(input).sort();
    const c14_quads      = rdfn3.dataset_to_nquads(c14n_input).sort();
    const expected_quads = rdfn3.dataset_to_nquads(expected).sort();
    const result         = compare_nquads(c14_quads,expected_quads);

    if (dump) {
        console.log(`*************** Test number ${num} *****************`);
        print_quads(input_quads, 'Input quads');
        print_quads(c14_quads,'Canonicalized quads');
        print_quads(expected_quads,'Expected quads');    
        const test_passes    = result ? 'passes' : 'fails';
        console.log(`===> Test ${test_passes} <===`);
    }
    return result;
}


/**
 * Main entry point.
 * 
 * ```
 * Usage: rdf_c14n [number] [options]
 *
 * Run a specific test from the test suite
 * 
 * Options:
 *   -f --full             Run the full tests suite, just return the list of fails
 *   -n --number [number]  Test number
 *   -d --debug            Display all log
 *   -t --trace            Display trace log
 *   -h, --help            display help for command
 * ```
 * 
 * @async
 */
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

    const canonicalizer = new RDFCanon(rdfn3.DataFactory);  

    const program = new Command();
    program
        .name ('rdf_c14n [number]')
        .description('Run a specific test from the test suite')
        .usage('[options]')
        .option('-f --full', 'Run the full tests suite, just return the list of fails')
        .option('-n --number [number]', 'Test number')
        .option('-d --debug', 'Display all log')
        .option('-t --trace', 'Display trace log')
        .parse(process.argv);

    const options = program.opts();
    const debug = options.debug ? true : false;
    const trace = options.trace ? true : false;

    if (options.full) {
        const base_tests = [...Array(number_of_tests).keys()].map((index: number): string => test_number(`${index}`));
        const tests = [...base_tests, ...extra_tests];
        tests.shift(); // There is no '000' test!

        // Run all the tests...
        const proms: boolean[] = await Promise.all(tests.map((num) => single_test(canonicalizer, num, false)));
        const failed_tests = tests
            // pair the test name and whether the tests passed:
            .map((value: string, index:number): [string, boolean] => [value, proms[index]])
            // filter the successful tests:
            .filter( (value: [string,boolean]): boolean => !value[1])
            // Keep the names only
            .map( ([test,result]: [string,boolean]): string => test);
        
        if (failed_tests.length === 0) {
            console.log('All tests passed')
        } else {
            console.log(`Failed tests: ${failed_tests}`)
        }
    } else {
        const logLevel = (debug) ? Levels.debug : ((trace) ? Levels.info : Levels.error);
        const logger = new SimpleLogger(logLevel);
        canonicalizer.set_logger(logger);

        const num = (program.args.length === 0) ? test_number(options.number) : test_number(program.args[0]);
        if (test_number_format.test(num)) {
            single_test(canonicalizer, num, true)
        } else {
            console.error('Invalid test number');
        }    
    }
}

main();
