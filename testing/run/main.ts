import { Command }                                 from 'commander';
import { RDFCanon, YamlLogger, LogLevels, Logger } from '../../index';
import * as rdfn3                                  from './rdfn3';

const number_of_tests: number = 63;
const extra_tests: string[] = ['900', '901']

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
async function singleTest(canonicalizer: RDFCanon, num: string, dump: boolean = true): Promise<boolean> {
    const input_fname    = `testing/tests/test${num}-in.nq`;
    const expected_fname = `testing/tests/test${num}-urdna2015.nq`
    const [input, expected] = await Promise.all([
        rdfn3.get_quads(input_fname),
        rdfn3.get_quads(expected_fname),
    ]);

    // Just for testing the direct nquad input...
    // const trig: string = await fs.readFile(input_fname, 'utf-8');
    // const c14n_input     = canonicalizer.canonicalize(trig);

    const c14n_result    = canonicalizer.canonicalizeDetailed(input);
    
    console.log('>>>>')
    console.log(c14n_result.dataset_nquad);
    console.log(c14n_result.bnode_id_map);
    console.log(`Hash on nquad: ${canonicalizer.hash(c14n_result.dataset_nquad)}`);
    console.log(`Hash on dataset: ${canonicalizer.hash(c14n_result.dataset)}`);
    console.log('>>>>');

    const c14n_input     = c14n_result.dataset;
    const input_quads    = rdfn3.dataset_to_nquads(input).sort();
    const c14_quads      = rdfn3.dataset_to_nquads(c14n_input).sort();
    const expected_quads = rdfn3.dataset_to_nquads(expected).sort();
    const result         = compareNquads(c14_quads,expected_quads);

    if (dump) {
        console.log(`*************** Test number ${num} *****************`);
        printQuads(input_quads, 'Input quads');
        printQuads(c14_quads,'Canonicalized quads');
        printQuads(expected_quads,'Expected quads');    
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
    const testNumber = (num ?: string): string => {
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

    const canonicalizer = new RDFCanon();  

    const program = new Command();
    program
        .name ('rdf_c14n [number]')
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

    if (options.full) {
        const base_tests = [...Array(number_of_tests).keys()].map((index: number): string => testNumber(`${index}`));
        const tests = [...base_tests, ...extra_tests];
        tests.shift(); // There is no '000' test!

        // Run all the tests...
        const proms: boolean[] = await Promise.all(tests.map((num) => singleTest(canonicalizer, num, false)));
        const failed_tests = tests
            // pair the test name and whether the tests passed:
            .map((value: string, index:number): [string, boolean] => [value, proms[index]])
            // filter the successful tests:
            .filter( (value: [string,boolean]): boolean => !value[1])
            // Keep the names only
            .map( ([test,_result]: [string,boolean]): string => test);
        
        if (failed_tests.length === 0) {
            console.log('All tests passed')
        } else {
            console.log(`Failed tests: ${failed_tests}`)
        }
    } else {
        let logger : Logger|undefined = undefined; // = new SimpleYamlLogger(logLevel);
        const logLevel = (debug) ? LogLevels.debug : ((trace) ? LogLevels.info : undefined);

        if (logLevel) {
            logger = new YamlLogger(logLevel);
            canonicalizer.setLogger(logger);
        }
    
        const num = (program.args.length === 0) ? testNumber(options.number) : testNumber(program.args[0]);
        if (test_number_format.test(num)) {
            await singleTest(canonicalizer, num, true);
            if (logger) {
                console.log("\n>> Log <<")
                console.log(logger.log);
            }
        } else {
            console.error('Invalid test number');
        }    
    }
}

main();
