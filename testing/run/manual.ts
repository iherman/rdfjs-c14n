import { RDFC10, LogLevels, Logger } from '../../index';
import * as rdfn3 from './rdfn3';
import * as n3 from 'n3';
import * as rdf from '@rdfjs/types';


async function main(): Promise<void> {

    const canon = new RDFC10();
    //const logger = canon.setLogger("YamlLogger", LogLevels.debug);
    const graph: rdf.Quad[] = [];
    const factory: rdf.DataFactory = n3.DataFactory;

    graph.push(factory.quad(
        factory.namedNode("https://www.example.org/s"),
        factory.namedNode("https://www.example.org/p"),
        factory.blankNode("b123")
    ));
    graph.push(factory.quad(
        factory.namedNode("https://www.example.org/s"),
        factory.namedNode("https://www.example.org/p"),
        factory.blankNode("b123")
    ));
    graph.push(factory.quad(
        factory.namedNode("https://www.example.org/s1"),
        factory.namedNode("https://www.example.org/p1"),
        factory.blankNode("bxyz")
    ));
    graph.push(factory.quad(
        factory.namedNode("https://www.example.org/s1"),
        factory.namedNode("https://www.example.org/p1"),
        factory.blankNode("bxyz")
    ));


    console.log(await canon.canonicalize(graph));
    //console.log(logger?.log);
}

main()
