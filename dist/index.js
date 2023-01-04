"use strict";
/**
 * Implementation of the RDF Canonicalization Algorithm, published by the W3C RCH Working Group.
 * See [specification](https://www.w3.org/TR/rdf-canon/) for the latest official version.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RDFCanon = exports.quadsToNquads = exports.LogLevels = exports.SimpleYamlLogger = void 0;
const common_1 = require("./lib/common");
const issueIdentifier_1 = require("./lib/issueIdentifier");
const canonicalization_1 = require("./lib/canonicalization");
const logging_1 = require("./lib/logging");
var logging_2 = require("./lib/logging");
Object.defineProperty(exports, "SimpleYamlLogger", { enumerable: true, get: function () { return logging_2.SimpleYamlLogger; } });
Object.defineProperty(exports, "LogLevels", { enumerable: true, get: function () { return logging_2.LogLevels; } });
var common_2 = require("./lib/common");
Object.defineProperty(exports, "quadsToNquads", { enumerable: true, get: function () { return common_2.quadsToNquads; } });
/**
 * Just a shell around the algorithm, consisting of a state, and the call for the real implementation.
 *
 * The variable parts of the state, as [defined in the spec](https://www.w3.org/TR/rdf-canon/#dfn-canonicalization-state),
 * are re-initialized at a call to the canonicalize call. Ie, the same class instance can be reused for
 * {@link RDFCanon#canonicalize} for different graphs.
 */
class RDFCanon {
    state;
    /**
     * @constructor
     * @param data_factory    An implementation of the generic RDF DataFactory interface, see [the specification](http://rdf.js.org/data-model-spec/#datafactory-interface).
     * @param dataset_factory An implementation of the generic RDF DatasetCoreFactory interface, see [the specification]https://rdf.js.org/dataset-spec/#datasetcorefactory-interface). If undefined, the canonicalized graph will automatically be a Set of quads.
     * @param logger          A logger instance; defaults to an "empty" logger, ie, no logging happens.
     */
    constructor(data_factory, dataset_factory) {
        this.state = {
            bnode_to_quads: {},
            hash_to_bnodes: {},
            canonical_issuer: new issueIdentifier_1.IDIssuer(),
            hash_algorithm: common_1.Constants.HASH_ALGORITHM,
            dataFactory: data_factory,
            datasetFactory: dataset_factory,
            logger: new logging_1.NopLogger(),
        };
    }
    /**
     * Set a logger instance.
     * @param logger
     */
    setLogger(logger) {
        this.state.logger = logger;
    }
    /**
     * Set hash algorithm. The value can be anything that the underlying openssl environment accepts. The default is "sha256".
     */
    setHashAlgorithm(algorithm) {
        this.state.hash_algorithm = algorithm;
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
    canonicalize(input_dataset) {
        return (0, canonicalization_1.computeCanonicalDataset)(this.state, input_dataset);
    }
    /**
     * Hash a dataset:
     *
     * 1. Compute a canonical version of the dataset
     * 2. Serialize the dataset into nquads and sort the result
     * 3. Compute the hash of the concatenated nquads.
     *
     * @param input_dataset
     * @returns
     */
    hash(input_dataset) {
        const canonicalized_dataset = this.canonicalize(input_dataset);
        return (0, common_1.hashDataset)(this.state, canonicalized_dataset, true);
    }
}
exports.RDFCanon = RDFCanon;
