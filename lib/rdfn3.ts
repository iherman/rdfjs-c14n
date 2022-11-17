/**
 * Direct interface to the N3 Package, essentially relying on the TriG parser and the DataFactory 
 * implementation. All other parts of the library should only depend on the general
 * rdf-js package, ie, the using the semi-official data model specification only.
 * 
 * @packageDocumentation
 */

import * as n3 from 'n3';
import * as rdf from 'rdf-js';

export const DataFactory = n3.DataFactory;

export function parse_trig(trig: string, parse_callback: n3.ParseCallback<n3.Quad>, prefix_callback: n3.PrefixCallback): void {
    const parser = new n3.Parser({format: "application/trig"});
    parser.parse(trig, parse_callback, prefix_callback);
}

export function write_nquads(quads: rdf.Quad[]): string[] {
    let retval: string[];
    const writer = new n3.Writer({format: "application/n-quads" })
    quads.forEach((quad) => writer.addQuad(quad.subject, quad.predicate, quad.object, quad.graph));
    writer.end( (error,result) => {
        retval = result.split('\n');
    })
    retval.filter( (item) => item !== '');
    return retval;
}
