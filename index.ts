import * as rdf from 'rdf-js';
import { GlobalState, Graph, QuadToNquad, Logger, NopLogger } from './lib/common';
import { IdIssuer }                                           from './lib/issue_identifier';
import { compute_canonicalized_graph }                        from './lib/canonicalization';

export { Graph, QuadToNquad, Logger }                         from './lib/common';

export class URDNA2015 {
    private _state:    GlobalState;
    /**
     * 
     * @param data_factory  An implementation of the generic RDF DataFactory interface, see http://rdf.js.org/data-model-spec/#datafactory-interface
     * @param quad_to_nquad A function that converts an rdf.Quad into a bona fide nquad string
     * @param logger        A logger instance; defaults to an "empty" logger, ie, no logging happens
     */
    constructor(data_factory: rdf.DataFactory, quad_to_nquad: QuadToNquad, logger: Logger = new NopLogger() ) {
        this._state = {
            bnode_to_quads   : {},
            // This will map a calculated hash value to the bnodes it characterizes. In
            // simple cases it is a 1-1 mapping but, sometimes, it is a 1-many.
            // This structure is filled in step 5
            hash_to_bnodes   : {},
            canonical_issuer : new IdIssuer(),
            data_factory     : data_factory,
            quad_to_nquad    : quad_to_nquad,
            logger           : logger
        }
    }

    /**
     * Implementation of the main algorithmic steps
     * 
     * @param input_dataset 
     * @returns 
     */
    canonicalize(input_dataset: Graph): Graph {
        return compute_canonicalized_graph(this._state, input_dataset);
    }
}
