import * as rdf from 'rdf-js';
import { Command }              from 'commander';
import { RDFCanon, Graph }      from '../index';
import { SimpleLogger, Levels } from './logger';
import * as rdfn3               from './rdfn3';
import { DatasetCoreFactory } from './rdfn3';


async function main(): Promise<void> {
    const program = new Command();
    program
        .name ('rdf_c14n')
        .usage('[options')
        .option('-i --input [file]', 'Name of the Turtle file to canonicalize')
        .option('-d --debug', 'Display all log')
        .option('-t --trace', 'Display trace log')
        .parse(process.argv);

    const options = program.opts();
    const debug = options.debug ? true : false;
    const trace = options.trace ? true : false;

    const logLevel = (debug) ? Levels.debug : ((trace) ? Levels.info : Levels.error);
    const logger = new SimpleLogger(logLevel);

    const fname: string = options.input ? `test_cases/${options.input}` : 'test_cases/unique_hashes_example.ttl';

    const input: Graph = await rdfn3.get_dataset(fname);

    logger.info(`Original graph: \n${rdfn3.dataset_to_nquads(input).join('\n')}`);

    const canonicalizer = new RDFCanon(rdfn3.DataFactory, rdfn3.DatasetCoreFactory, rdfn3.quad_to_nquad, logger);
    const normalized: Graph = canonicalizer.canonicalize(input);

    const normalized_quads: string = rdfn3.dataset_to_nquads(normalized).sort().join('\n');
    console.log(`Canonicalized graph: \n${normalized_quads}`);
}

main()



