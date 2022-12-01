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
import { Graph }        from '../index';

export const DataFactory = n3.DataFactory;

/**
 * Convert a Quad into its NQuad equivalent.
 * 
 * @param quad 
 * @returns 
 */
export function quad_to_nquad(quad: rdf.Quad): string {
    return graph_to_nquads([quad])[0];
}

/**
 * Convert the graph into NQuads, more exactly into an array of individual NQuad statement
 * @param quads 
 * @returns 
 */
export function graph_to_nquads(quads: Graph|rdf.Quad[]): string[] {
    let retval: string[] = [];
    const writer = new n3.Writer({format: "application/n-quads" })
    quads.forEach((quad) => writer.addQuad(quad.subject, quad.predicate, quad.object, quad.graph));
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
 export async function get_graph(fname: string): Promise<Graph> {
    // The function is called by the parser for each quad; it is used to store the data in the final set of quads.
    const add_quad = (error: Error, quad: rdf.Quad, prefixes: any): void => {
        if (error) {
            throw(error);
        } else if( quad !== null) {
            graph.add(quad);
        } 
    };
    
    const graph: Graph = new Set<rdf.Quad>();
    const trig: string = await fs.readFile(fname, 'utf-8');
    const parser = new n3.Parser({format: "application/trig"});
    parser.parse(trig, add_quad);
    return graph;
}

