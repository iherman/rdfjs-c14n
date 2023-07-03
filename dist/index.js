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
exports.RDFCanon = exports.RDFC10 = exports.LogLevels = void 0;
const n3 = require("n3");
const common_1 = require("./lib/common");
const config = require("./lib/config");
const issueIdentifier_1 = require("./lib/issueIdentifier");
const canonicalization_1 = require("./lib/canonicalization");
const logging_1 = require("./lib/logging");
var logging_2 = require("./lib/logging");
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
        const { c14n_complexity, c14n_hash } = (0, common_1.configData)();
        this.state = {
            bnode_to_quads: {},
            hash_to_bnodes: {},
            canonical_issuer: new issueIdentifier_1.IDIssuer(),
            hash_algorithm: c14n_hash,
            dataFactory: data_factory ? data_factory : n3.DataFactory,
            logger: logging_1.LoggerFactory.createLogger(logging_1.LoggerFactory.DEFAULT_LOGGER),
            logger_id: logging_1.LoggerFactory.DEFAULT_LOGGER,
            complexity_number: c14n_complexity,
            maximum_n_degree_call: 0,
            current_n_degree_call: 0
        };
    }
    /**
     * Create and set a logger instance
     *
     * @param logger
     */
    setLogger(id = logging_1.LoggerFactory.DEFAULT_LOGGER, level = logging_1.LogLevels.debug) {
        const new_logger = logging_1.LoggerFactory.createLogger(id, level);
        if (new_logger !== undefined) {
            this.state.logger_id = id;
            this.state.logger = new_logger;
            return new_logger;
        }
        else {
            return undefined;
        }
    }
    /**
     * Current logger type
     */
    get logger_type() {
        return this.state.logger_id;
    }
    /**
     * List of available logger types.
     */
    get available_logger_types() {
        return logging_1.LoggerFactory.loggerTypes();
    }
    /**
     * Set Hash algorithm. The value can be anything that the underlying openssl, as used by node.js, accepts. The default is "sha256".
     * If the algorithm is not listed as existing for openssl, the value is ignored (and an exception is thrown).
     */
    set hash_algorithm(algorithm) {
        if (config.HASH_ALGORITHMS.includes(algorithm)) {
            this.state.hash_algorithm = algorithm;
        }
        else {
            const error_message = `"${algorithm}" is not a valid Hash Algorithm name`;
            throw TypeError(error_message);
        }
    }
    get hash_algorithm() {
        return this.state.hash_algorithm;
    }
    /**
     * List of available hash algorithm names.
     */
    get available_hash_algorithms() {
        return config.HASH_ALGORITHMS;
    }
    /**
     * Set the maximal complexity number. This number, multiplied with the number of blank nodes in the dataset,
     * sets a maximum level of calls the algorithm can do for the so called "hash n degree quads" function.
     * Setting this number to a reasonably low number (say, 30),
     * ensures that some "poison graphs" would not result in an unreasonably long canonicalization process.
     * See the [security consideration section](https://www.w3.org/TR/rdf-canon/#security-considerations) in the specification.
     *
     * The default value set by this implementation is 50; any number _greater_ then this number is ignored (and an exception is thrown).
     */
    set maximum_complexity_number(level) {
        if (!Number.isNaN(level) && Number.isInteger(level) && level > 0 && level < config.DEFAULT_MAXIMUM_COMPLEXITY) {
            this.state.complexity_number = level;
        }
        else {
            const error_message = `Required complexity must be between 0 and ${config.DEFAULT_MAXIMUM_COMPLEXITY}`;
            throw RangeError(error_message);
        }
    }
    get maximum_complexity_number() {
        return this.state.complexity_number;
    }
    /**
     * The system-wide maximum value for the recursion level. The current maximum recursion level cannot exceed this value.
     */
    get maximum_allowed_complexity_number() {
        return config.DEFAULT_MAXIMUM_COMPLEXITY;
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
        return this.canonicalizeDetailed(input_dataset).canonical_form;
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
