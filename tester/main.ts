import * as rdf from 'rdf-js';
import { Command }   from 'commander';
import { URDNA2015 } from '../lib/c14n';
import { Graph }     from '../lib/types';
import * as rdfn3    from './rdfn3'

async function main(): Promise<void> {
    const program = new Command();
    program
        .name ('rdf_c14n')
        .usage('[options')
        .option('-i --input [file]', 'Name of the Turtle file to canonicalize')
        .parse(process.argv);

    const options = program.opts();
    const fname: string = options.input ? options.input : 'test_cases/simple.ttl';

    const input: Graph = await rdfn3.get_graph(fname);
    const canonicalizer = new URDNA2015(rdfn3.DataFactory,rdfn3.quad_to_nquad);
    const normalized: Graph = canonicalizer.canonicalize(input);
    console.log(rdfn3.graph_to_nquads(normalized).join('\n'));
    // canonicalizer.debug();
}

main()


