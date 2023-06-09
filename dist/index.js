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
exports.RDFCanon = exports.RDFC10 = exports.LogLevels = exports.YamlLogger = void 0;
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
 * are re-initialized at a call to the canonicalize call. Ie, the same class instance can be reused to
 * {@link RDFC10#canonicalize} for different graphs.
 */
class RDFC10 {
    state;
    /**
     * @constructor
     * @param data_factory  An implementation of the generic RDF DataFactory interface, see [the specification](http://rdf.js.org/data-model-spec/#datafactory-interface). If undefined, the DataFactory of the [n3 package](https://www.npmjs.com/package/n3) is used.
     */
    constructor(data_factory) {
        this.state = {
            bnode_to_quads: {},
            hash_to_bnodes: {},
            canonical_issuer: new issueIdentifier_1.IDIssuer(),
            hash_algorithm: common_1.Constants.HASH_ALGORITHM,
            dataFactory: data_factory ? data_factory : n3.DataFactory,
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
     * If the algorithm is not listed as existing for openssl, the value is ignored.
     */
    setHashAlgorithm(algorithm) {
        if (common_1.Constants.HASH_ALGORITHMS.includes(algorithm)) {
            this.state.hash_algorithm = algorithm;
        }
    }
    /**
     * Canonicalize a Dataset into an N-Quads document.
     *
     * Implementation of the main algorithmic steps, see
     * [separate overview in the spec](https://www.w3.org/TR/rdf-canon/#canon-algo-overview). The
     * real work is done in the [separate function](../functions/lib_canonicalization.computeCanonicalDataset.html).
     *
     * @remarks
     * Note that the N-Quads parser throws an exception in case of syntax error.
     *
     * @param input_dataset
     * @returns - N-Quads document using the canonical ID-s.
     *
     */
    canonicalize(input_dataset) {
        return this.canonicalizeDetailed(input_dataset).dataset_nquad;
    }
    /**
     * Canonicalize a Dataset into a full set of information.
     *
     * Implementation of the main algorithmic steps, see
     * [separate overview in the spec](https://www.w3.org/TR/rdf-canon/#canon-algo-overview). The
     * real work is done in the [separate function](../functions/lib_canonicalization.computeCanonicalDataset.html).
     *
     * The result is an Object containing the serialized version and the Quads version of the canonicalization result,
     * as well as a bnode mapping from the original to the canonical equivalents
     *
     * @remarks
     * Note that the N-Quads parser throws an exception in case of syntax error.
     *
     * @param input_dataset
     * @returns - Detailed results of the canonicalization
     */
    canonicalizeDetailed(input_dataset) {
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
     * 1. Serialize the dataset into nquads and sort the result (unless the input is an N-Quads document)
     * 2. Compute the hash of the concatenated nquads.
     *
     * This method is typically used on the result of the canonicalization to compute the canonical hash of a dataset.
     *
     * @param input_dataset
     * @returns
     */
    hash(input_dataset) {
        if (typeof input_dataset === 'string') {
            return (0, common_1.computeHash)(this.state, input_dataset);
        }
        else {
            return (0, common_1.hashDataset)(this.state, input_dataset, true);
        }
    }
}
exports.RDFC10 = RDFC10;
/**
 * Alternative name for {@link RDFC10}.
 *
 * @remark
 * This is only for possible backward compatibility's sake; this was the old name of the class
 * The WG has decided what the final name of the algorithm is (RDFC 1.0), hence the renaming of the core
 * class.
 */
class RDFCanon extends RDFC10 {
}
exports.RDFCanon = RDFCanon;
;
