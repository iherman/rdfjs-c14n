/**
 * Implementation of the RDF Canonicalization Algorithm, published by the W3C RCH Working Group. 
 * See [specification](https://www.w3.org/TR/rdf-canon/) for the latest official version.
 * 
 * @copyright Ivan Herman 2023
 * 
 * @packageDocumentation
 */

import * as rdf from 'rdf-js';
import * as n3  from 'n3';

import { GlobalState, Quads, hashDataset, Hash, Constants, quadsToNquads } from './lib/common';
import { IDIssuer }                                                        from './lib/issueIdentifier';
import { computeCanonicalDataset }                                         from './lib/canonicalization';
import { Logger, NopLogger}                                                from './lib/logging';

export { Quads }                         from './lib/common';
export { Hash }                          from './lib/common';
export { YamlLogger, LogLevels, Logger } from './lib/logging';

/**
 * Just a shell around the algorithm, consisting of a state, and the call for the real implementation.
 * 
 * The variable parts of the state, as [defined in the spec](https://www.w3.org/TR/rdf-canon/#dfn-canonicalization-state), 
 * are re-initialized at a call to the canonicalize call. Ie, the same class instance can be reused for
 * {@link RDFCanon#canonicalize} for different graphs.
 */
export class RDFCanon {
    private state: GlobalState;
    /**
     * @constructor
     * @param data_factory  An implementation of the generic RDF DataFactory interface, see [the specification](http://rdf.js.org/data-model-spec/#datafactory-interface). If undefined, the DataFactory of the [n3 package](https://www.npmjs.com/package/n3) is used.
     * @param dataset_factory An implementation of the generic RDF DatasetCoreFactory interface, see [the specification](https://rdf.js.org/dataset-spec/#datasetcorefactory-interface). If undefined, the canonicalized graph will automatically be a Set of quads.
     */
    constructor(data_factory?: rdf.DataFactory, dataset_factory?: rdf.DatasetCoreFactory) {
        this.state = {
            bnode_to_quads   : {},
            hash_to_bnodes   : {},
            canonical_issuer : new IDIssuer(),
            hash_algorithm   : Constants.HASH_ALGORITHM,
            dataFactory      : data_factory ? data_factory : n3.DataFactory,
            datasetFactory   : dataset_factory,
            logger           : new NopLogger(),
        }
    }

    /**
     * Set a logger instance. 
     * @param logger 
     */
    setLogger(logger: Logger): void {
        this.state.logger = logger;
    }

    /**
     * Set the hash algorithm. The value can be anything that the underlying openssl, as used by node.js, accepts. The default is "sha256".
     */
    setHashAlgorithm(algorithm: string): void {
        this.state.hash_algorithm = algorithm;
    }

    /**
     * Canonicalize a Dataset.
     * 
     * Implementation of the main algorithmic steps, see [separate overview in the spec](https://www.w3.org/TR/rdf-canon/#canon-algo-overview). The
     * real work is done in the [separate function](../functions/lib_canonicalization.compute_canonicalized_graph.html).
     * 
     * @param input_dataset 
     * @returns - the exact type of the output depends on the type of the input dataset. If the input is a Set or an Array, so will be the return. If it is a Dataset, and the dataset_factory has been set set, it will be a Dataset, otherwise a Set.
     */
    canonicalize(input_dataset: Quads): Quads {
        return computeCanonicalDataset(this.state, input_dataset);
    }

    /**
     * Serialize the dataset into a (possibly sorted) Array of nquads.
     * 
     * @param input_dataset 
     * @param sort If `true` (the default) the array is lexicographically sorted
     * @returns 
     */
    toNquads(input_dataset: Quads, sort: boolean = true): string[] {
        return quadsToNquads(input_dataset, sort);
    }

    /**
     * Hash a dataset:
     * 
     * 1. Serialize the dataset into nquads and sort the result
     * 2. Compute the hash of the concatenated nquads.
     * 
     * This method is typically used on the result of the canonicalization to compute the canonical hash of a dataset.
     * 
     * @param input_dataset 
     * @returns
     */
    hash(input_dataset: Quads): Hash {
        return hashDataset(this.state, input_dataset, true);
    }
}


