import { Command } from 'commander';
import { RDFC10, LogLevels, Logger } from '../../index';
import * as rdfn3 from './rdfn3';

const number_of_tests: number = 74;
const extra_tests: string[] = [];

// Note that test 900 MUST fail with an exception (it is a poison graph...)

// The format of all test numbers
const test_number_format = RegExp('^[0-9][0-9][0-9]$');

// Compare two quad array for equality.
function compareNquads(left: string[], right: string[]): boolean {
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
function printQuads(nquads: string[], label: string): void {
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
async function singleTest(canonicalizer: RDFC10, num: string, dump: boolean = true): Promise<boolean> {
    try {
        const input_fname = `testing/tests/test${num}-in.nq`;
        const expected_fname = `testing/tests/test${num}-rdfc10.nq`;
        const [input, expected] = await Promise.all([
            rdfn3.get_quads(input_fname),
            rdfn3.get_quads(expected_fname),
        ]);

        // console.log(`Current maximal level of recursion: ${canonicalizer.maximum_recursion_level}`);
        // canonicalizer.maximum_recursion_level = 6;
        // console.log(`Set maximal level of recursion: ${canonicalizer.maximum_recursion_level}`);
        // console.log(`System wide maximum recursion level: ${canonicalizer.maximum_allowed_recursion_level}`)

        // console.log(`Hash algorithm: ${canonicalizer.hash_algorithm}`);
        // console.log(`available hash algorithms: ${canonicalizer.available_hash_algorithms}`)

        // Just for testing the direct nquad input...
        // const trig: string = await fs.readFile(input_fname, 'utf-8');
        const c14n_result = await canonicalizer.c14n(input);

        // console.log('>>>>')
        // console.log(c14n_result.canonical_form);
        // console.log(c14n_result.bnode_identifier_map);
        // console.log(`Hash on nquad: ${await canonicalizer.hash(c14n_result.canonical_form)}`);
        // console.log(`Hash on dataset: ${await canonicalizer.hash(c14n_result.canonicalized_dataset)}`);
        // console.log('>>>>');

        const c14n_input = c14n_result.canonicalized_dataset;
        const input_quads = rdfn3.dataset_to_nquads(input).sort();
        const c14_quads = rdfn3.dataset_to_nquads(c14n_input).sort();
        const expected_quads = rdfn3.dataset_to_nquads(expected).sort();
        const result = compareNquads(c14_quads, expected_quads);

        if (dump) {
            console.log(`*************** Test number ${num} *****************`);
            printQuads(input_quads, 'Input quads');
            printQuads(c14_quads, 'Canonicalized quads');
            printQuads(expected_quads, 'Expected quads');
            const test_passes = result ? 'passes' : 'fails';
            console.log(`===> Test ${test_passes} <===`);
        }
        return result;
    } catch(e) {
        console.log(`Single test on ${num} aborted: "${e.name}: ${e.message}, see ${e.stack}"`);
        return false;
    }
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
    const testNumber = (num?: string): string => {
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
            return "002";
        }
    };

    const canonicalizer = new RDFC10();

    const program = new Command();
    program
        .name('rdf_c14n [number]')
        .description('Run a specific test from the test suite')
        .usage('[options]')
        .option('-f --full', 'Run the full tests suite, just return the list of fails')
        .option('-n --number [number]', 'Test number')
        .option('-d --debug', 'Display all log')
        .option('-t --trace', 'Display trace and debug log')
        .parse(process.argv);

    const options = program.opts();
    const debug = options.debug ? true : false;
    const trace = options.trace ? true : false;

    try {
        if (options.full) {
            const base_tests = [...Array(number_of_tests).keys()].map((index: number): string => testNumber(`${index}`));
            const tests = [...base_tests, ...extra_tests];
            tests.shift(); // There is no '000' test!

            const failed_tests: string[] = [];
            for (const test of tests) {
                const result = await singleTest(canonicalizer, test, false);
                if (result === false) {
                    failed_tests.push(test);
                }
            }

            if (failed_tests.length === 0) {
                console.log('All tests passed');
            } else {
                console.log(`Failed tests: ${failed_tests}`);
            }
        } else {
            let logger: Logger | undefined = undefined; // = new SimpleYamlLogger(logLevel);
            const logLevel = (debug) ? LogLevels.debug : ((trace) ? LogLevels.info : undefined);

            if (logLevel) {
                logger = canonicalizer.setLogger("YamlLogger", logLevel);
            }

            const num = (program.args.length === 0) ? testNumber(options.number) : testNumber(program.args[0]);
            if (test_number_format.test(num)) {
                try {
                    await singleTest(canonicalizer, num, true);
                } catch(e) {
                    console.error(`Something went wrong in the canonicalization step: "${e.name}: ${e.message}"`);
                }
                if (logger) {
                    console.log("\n>> Log <<");
                    console.log(logger.log);
                }
            } else {
                console.error('Invalid test number');
            }
        }
    } catch (e) {
        console.error(`Canonicalization algorithm aborted: "${e.name}: ${e.message}"`);
    }
}

main();
