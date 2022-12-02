/**
 * Direct interface to the N3 Package, essentially relying on the TriG parser and the DataFactory 
 * implementation. All other parts of the library should only depend on the general
 * rdf-js package, ie, the using the semi-official data model specification only.
 * 
 * @packageDocumentation
 */

import {promises as fs} from 'fs';
import * as n3          from 'n3';
import * as rdf         from 'rdf-js';

type Dataset = rdf.DatasetCore<rdf.Quad,rdf.Quad>;

class n3_DatasetCoreFactory implements rdf.DatasetCoreFactory {
    dataset(quads?: rdf.Quad[]): Dataset {
        const store = new n3.Store();
        if (quads) {
            store.addQuads(quads);
        }
        return store;
    }
}



/**
 * Convert a Quad into its NQuad equivalent.
 * 
 * @param quad 
 * @returns 
 */
export function quad_to_nquad(quad: rdf.Quad): string {
    return dataset_to_nquads([quad])[0];
}

/**
 * Convert the graph into NQuads, more exactly into an array of individual NQuad statement
 * @param quads 
 * @returns 
 */
export function dataset_to_nquads(quads: Dataset|rdf.Quad[]): string[] {
    let retval: string[] = [];
    const writer = new n3.Writer({format: "application/n-quads" })
    for (const quad of quads) {
        writer.addQuad(quad.subject, quad.predicate, quad.object, quad.graph)
    }
    writer.end( (error,result) => {
        retval = result.split('\n');
    })
    retval.filter( (item) => item !== '');
    return retval;
}

/**
 * Parse a turtle/trig file and return the result in a set of RDF Quads. The prefix declarations are also added to the list of prefixes.
 * 
 * @param fname TriG file name
 * @returns 
 */
export async function get_dataset(fname: string): Promise<Dataset> {
    // The function is called by the parser for each quad; it is used to store the data in the final set of quads.
    const add_quad = (error: Error, quad: rdf.Quad, prefixes: any): void => {
        if (error) {
            throw(error);
        } else if( quad !== null) {
            graph.add(quad);
        } 
    };
    
    const graph: Dataset = new n3.Store();
    const trig: string = await fs.readFile(fname, 'utf-8');
    const parser = new n3.Parser({format: "application/trig"});
    parser.parse(trig, add_quad);
    return graph;
}

export const DataFactory: rdf.DataFactory               = n3.DataFactory;
export const DatasetCoreFactory: rdf.DatasetCoreFactory = new n3_DatasetCoreFactory();



// async function test(): Promise<void> {
//     const data = await get_graph('../test_cases/shared_hashes_example.ttl');
//     console.log(graph_to_nquads(data))
// }

// test();
