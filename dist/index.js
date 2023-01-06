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
exports.RDFCanon = exports.LogLevels = exports.YamlLogger = void 0;
const n3 = require("n3");
const common_1 = require("./lib/common");
const issueIdentifier_1 = require("./lib/issueIdentifier");
const canonicalization_1 = require("./lib/canonicalization");
const logging_1 = require("./lib/logging");
var logging_2 = require("./lib/logging");
Object.defineProperty(exports, "YamlLogger", { enumerable: true, get: function () { return logging_2.YamlLogger; } });
Object.defineProperty(exports, "LogLevels", { enumerable: true, get: function () { return logging_2.LogLevels; } });
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
     * @param data_factory  An implementation of the generic RDF DataFactory interface, see [the specification](http://rdf.js.org/data-model-spec/#datafactory-interface). If undefined, the DataFactory of the [n3 package](https://www.npmjs.com/package/n3) is used.
     * @param dataset_factory An implementation of the generic RDF DatasetCoreFactory interface, see [the specification](https://rdf.js.org/dataset-spec/#datasetcorefactory-interface). If undefined, the canonicalized graph will automatically be a Set of quads.
     */
    constructor(data_factory, dataset_factory) {
        this.state = {
            bnode_to_quads: {},
            hash_to_bnodes: {},
            canonical_issuer: new issueIdentifier_1.IDIssuer(),
            hash_algorithm: common_1.Constants.HASH_ALGORITHM,
            dataFactory: data_factory ? data_factory : n3.DataFactory,
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
     * Set the hash algorithm. The value can be anything that the underlying openssl, as used by node.js, accepts. The default is "sha256".
     */
    setHashAlgorithm(algorithm) {
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
    canonicalize(input_dataset) {
        return (0, canonicalization_1.computeCanonicalDataset)(this.state, input_dataset);
    }
    /**
     * Serialize the dataset into a (possibly sorted) Array of nquads.
     *
     * @param input_dataset
     * @param sort If `true` (the default) the array is lexicographically sorted
     * @returns
     */
    toNquads(input_dataset, sort = true) {
        return (0, common_1.quadsToNquads)(input_dataset, sort);
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
    hash(input_dataset) {
        return (0, common_1.hashDataset)(this.state, input_dataset, true);
    }
}
exports.RDFCanon = RDFCanon;
