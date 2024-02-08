/**
 * Direct interface to the N3 Package, essentially relying on the TriG parser and the DataFactory 
 * implementation. All other parts of the library should only depend on the general
 * rdf-js package, ie, the using the semi-official data model specification only.
 * 
 * @packageDocumentation
 */

import * as n3 from 'n3';
import * as rdf from '@rdfjs/types';
import { promises as fs } from 'fs';
import { nquads } from '@tpluscode/rdf-string';

/**
 * Convert the graph into NQuads, more exactly into an array of individual NQuad statement
 * @param quads 
 * @returns 
 */
export function dataset_to_nquads(quads: Iterable<rdf.Quad>): string[] {
    const quad_to_nquad = (quad: rdf.Quad): string => {
        const retval = nquads`${quad}`.toString();
        return retval.endsWith('  .') ? retval.replace(/  .$/, ' .') : retval;
    };

    let retval: string[] = [];
    for (const quad of quads) {
        retval.push(quad_to_nquad(quad));
    }
    return retval;
}

/**
 * Parse a turtle/trig file and return the result in a set of RDF Quads. The prefix declarations are also added to the list of prefixes.
 * Input format is a permissive superset of Turtle, TriG, N-Triples, and N-Quads.
 * 
 * An extra option is used to re-use the blank node id-s in the input without modification. This helps debugging...
 * 
 * @param fname - file name
 * @returns 
 */
export async function get_quads(fname: string): Promise<Set<rdf.Quad>> {
    const trig: string = await fs.readFile(fname, 'utf-8');
    const parser = new n3.Parser({ blankNodePrefix: '' });
    const quads: rdf.Quad[] = parser.parse(trig);
    return new Set<rdf.Quad>(quads);
}


export const DataFactory: rdf.DataFactory = n3.DataFactory;
