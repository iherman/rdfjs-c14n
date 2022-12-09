/**
 * Implementation of the RDF Canonicalization Algorithm, published by the W3C RCH Working Group. 
 * See [specification](https://www.w3.org/TR/rdf-canon/) for the latest official version.
 * 
 * @copyright Ivan Herman 2023
 * 
 * @packageDocumentation
 */


import * as rdf from 'rdf-js';
import { GlobalState, Quads, Logger, NopLogger, hash_dataset, Hash, Constants } from './lib/common';
import { IdIssuer }                                                             from './lib/issue_identifier';
import { compute_canonicalized_graph }                                          from './lib/canonicalization';

export { Quads }        from './lib/common';
export { hash_dataset } from './lib/common';
export { Hash }         from './lib/common';

/**
 * Just a shell around the algorithm, consisting of a state, and the call for the real implementation.
 * 
 * The variable parts of the state, as [defined in the spec](https://www.w3.org/TR/rdf-canon/#dfn-canonicalization-state), 
 * are re-initialized at a call to the canonicalize call. Ie, the same class instance can be reused for
 * {@link RDFCanon#canonicalize} for different graphs.
 */
export class RDFCanon {
    private _state:    GlobalState;
    /**
     * @constructor
     * @param data_factory    An implementation of the generic RDF DataFactory interface, see [the specification](http://rdf.js.org/data-model-spec/#datafactory-interface).
     * @param dataset_factory An implementation of the generic RDF DatasetCoreFactory interface, see [the specification]https://rdf.js.org/dataset-spec/#datasetcorefactory-interface). If undefined, the canonicalized graph will automatically be a Set of quads.
     * @param logger          A logger instance; defaults to an "empty" logger, ie, no logging happens.
     */
    constructor(data_factory: rdf.DataFactory, dataset_factory?: rdf.DatasetCoreFactory, logger?: Logger) {
        this._state = {
            bnode_to_quads   : {},
            hash_to_bnodes   : {},
            canonical_issuer : new IdIssuer(),
            data_factory     : data_factory,
            dataset_factory  : dataset_factory,
            logger           : logger || new NopLogger(),
        }
    }

    /**
     * Set a logger instance. 
     * @param logger 
     */
    set_logger(logger: Logger): void {
        this._state.logger = logger;
    }

    /**
     * Canonicalize a Dataset.
     * 
     * Implementation of the main algorithmic steps, see [separate overview in the spec](https://www.w3.org/TR/rdf-canon/#canon-algo-overview). The
     * real work is done in [separate](../functions/lib_canonicalization.compute_canonicalized_graph.html) function.
     * 
     * @param input_dataset 
     * @returns - the exact type of the output depends on the type of the input dataset. If the input is a Set or an Array, so will be the return. If it is a Dataset, and the dataset_factory has been set set, it will be a Dataset, otherwise a Set.
     */
    canonicalize(input_dataset: Quads): Quads {
        return compute_canonicalized_graph(this._state, input_dataset);
    }

    /**
     * Hash a dataset:
     * 
     * 1. Compute a canonical version of the dataset
     * 2. Serialize the dataset into nquads and sort the result
     * 3. Compute the hash of the concatenated nquads.
     * 
     * @param input_dataset 
     * @param algorithm - Hash algorithm to use. The value can be anything that the underlying openssl environment accepts, defaults to sha256.
     * @returns
     */
    hash(input_dataset: Quads, algorithm: string = Constants.HASH_ALGORITHM): Hash {
        const canonicalized_dataset = this.canonicalize(input_dataset);
        return hash_dataset(canonicalized_dataset, true, algorithm);
    }
}


