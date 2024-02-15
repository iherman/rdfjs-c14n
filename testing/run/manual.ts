import { RDFC10, LogLevels, Logger } from '../../index';
import * as rdfn3 from './rdfn3';
import * as n3 from 'n3';
import * as rdf from '@rdfjs/types';


async function main(): Promise<void> {

    const canon_multi = new RDFC10();
    const logger_multi = canon_multi.setLogger("YamlLogger", LogLevels.debug);

    const canon_single = new RDFC10();
    const logger_single = canon_single.setLogger("YamlLogger", LogLevels.debug);

     const factory: rdf.DataFactory = n3.DataFactory;
 
    const q1_a = factory.quad(
        factory.namedNode("https://www.example.org/s"),
        factory.namedNode("https://www.example.org/p"),
        factory.blankNode("b123")
    );
    const q1_b = factory.quad(
        factory.namedNode("https://www.example.org/s"),
        factory.namedNode("https://www.example.org/p"),
        factory.blankNode("b123")
    );
    const q2_a = factory.quad(
        factory.namedNode("https://www.example.org/s1"),
        factory.namedNode("https://www.example.org/p1"),
        factory.blankNode("bxyz")
    );
    const q2_b = factory.quad(
        factory.namedNode("https://www.example.org/s1"),
        factory.namedNode("https://www.example.org/p1"),
        factory.blankNode("bxyz")
    );

    const graph_multi  = [q1_a,q1_b,q2_a,q2_b];
    const graph_single = [q1_a,q2_b];

    await canon_single.canonicalize(graph_single);
    await canon_multi.canonicalize(graph_multi, true);

    // These two logs should be exactly the same!
    console.log("--- single")
    console.log(logger_single?.log);
    console.log("--- multi")
    console.log(logger_multi?.log);
}

main()
