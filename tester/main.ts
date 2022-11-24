import * as rdf from 'rdf-js';
import { Command }              from 'commander';
import { URDNA2015 }            from '../lib/c14n';
import { Graph }                from '../lib/types';
import { SimpleLogger, Levels } from './logger';
import * as rdfn3               from './rdfn3';


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

    const fname: string = options.input ? options.input : 'test_cases/simple.ttl';

    const input: Graph = await rdfn3.get_graph(fname);
    const canonicalizer = new URDNA2015(rdfn3.DataFactory,rdfn3.quad_to_nquad,logger);
    const normalized: Graph = canonicalizer.canonicalize(input);
    logger.info(rdfn3.graph_to_nquads(normalized).join('\n'));
    canonicalizer.debug();
}

main()



