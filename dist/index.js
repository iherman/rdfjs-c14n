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
exports.RDFC10 = exports.LogLevels = void 0;
const n3 = require("n3");
const common_1 = require("./lib/common");
const config_1 = require("./lib/config");
const issueIdentifier_1 = require("./lib/issueIdentifier");
const canonicalization_1 = require("./lib/canonicalization");
const logging_1 = require("./lib/logging");
var logging_2 = require("./lib/logging");
Object.defineProperty(exports, "LogLevels", { enumerable: true, get: function () { return logging_2.LogLevels; } });
/**
 * Just a shell around the algorithm, consisting of a state, and the calls to the real implementation.
 *
 * The variable parts of the state, as [defined in the spec](https://www.w3.org/TR/rdf-canon/#dfn-canonicalization-state),
 * are re-initialized at the canonicalize call. Ie, the same class instance can therefore be reused to
 * {@link RDFC10#canonicalize} for different graphs.
 */
class RDFC10 {
    state;
    /**
     * @constructor
     * @param data_factory  An implementation of the generic RDF DataFactory interface, see [the specification](http://rdf.js.org/data-model-spec/#datafactory-interface). If undefined, the DataFactory of the [n3 package](https://www.npmjs.com/package/n3) is used.
     * @param getConfigData A function returning the configuration data, see {@link ConfigData}. By default, this returns the constant values set in the code; the caller may provide a more complex function to handle environment variables and/or configuration files.
     */
    constructor(data_factory, getConfigData) {
        const localGetConfigData = (getConfigData !== undefined && getConfigData !== null) ? getConfigData : config_1.defaultConfigData;
        const { c14n_complexity, c14n_hash } = localGetConfigData();
        this.state = {
            bnode_to_quads: {},
            hash_to_bnodes: {},
            canonical_issuer: new issueIdentifier_1.IDIssuer(),
            hash_algorithm: c14n_hash,
            dataFactory: (data_factory !== null && data_factory !== undefined) ? data_factory : n3.DataFactory,
            logger: logging_1.LoggerFactory.createLogger(logging_1.LoggerFactory.DEFAULT_LOGGER),
            logger_id: logging_1.LoggerFactory.DEFAULT_LOGGER,
            complexity_number: c14n_complexity,
            maximum_n_degree_call: 0,
            current_n_degree_call: 0
        };
    }
    /**
     * Create and set a logger instance. By default it is an "empty" logger, ie, no logging happens.
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
     * Current logger type.
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
     * Set the Hash algorithm (default is "sha256").
     * If the algorithm isn't available the value is ignored (and an exception is thrown).
     *
     * The name is considered to be case insensitive. Also, both the format including a '-' dash character or not
     * are accepted (i.e., "sha256" and "sha-256" are both fine).
     *
     * @param algorithm_in: the (case insensitive) name of the algorithm.
     */
    set hash_algorithm(algorithm_in) {
        // To avoid stupid case dependent misspellings...
        const algorithm = algorithm_in.toLowerCase();
        if (Object.keys(config_1.AVAILABLE_HASH_ALGORITHMS).includes(algorithm)) {
            this.state.hash_algorithm = algorithm;
        }
        else {
            const error_message = `"${algorithm_in}" is not a valid Hash Algorithm name`;
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
        return Object.keys(config_1.AVAILABLE_HASH_ALGORITHMS);
    }
    /**
     * Set the maximal complexity number. This number, multiplied with the number of blank nodes in the dataset,
     * sets a maximum number of calls the algorithm can do for the so called "hash n degree quads" function.
     * Setting this number to a reasonably low number (say, 30), ensures that some "poison graphs" would not result in
     * an unreasonably long canonicalization process.
     * See the [security consideration section](https://www.w3.org/TR/rdf-canon/#security-considerations) in the specification.
     *
     * The default value set by this implementation is 50; any number _greater_ then this number is ignored (and an exception is thrown).
     */
    set maximum_complexity_number(level) {
        if (!Number.isNaN(level) && Number.isInteger(level) && level > 0 && level < config_1.DEFAULT_MAXIMUM_COMPLEXITY) {
            this.state.complexity_number = level;
        }
        else {
            const error_message = `Required complexity must be between 0 and ${config_1.DEFAULT_MAXIMUM_COMPLEXITY}`;
            throw RangeError(error_message);
        }
    }
    get maximum_complexity_number() {
        return this.state.complexity_number;
    }
    /**
     * The system-wide maximum value for the complexity level. The current maximum complexity level cannot exceed this value.
     */
    get maximum_allowed_complexity_number() {
        return config_1.DEFAULT_MAXIMUM_COMPLEXITY;
    }
    /**
     * Canonicalize a Dataset into an N-Quads document.
     *
     * Implementation of the main algorithm, see the
     * [separate overview in the spec](https://www.w3.org/TR/rdf-canon/#canon-algo-overview).
     *
     * (The real work is done in the [separate function](../functions/lib_canonicalization.computeCanonicalDataset.html)).
     *
     * @remarks
     * Note that the N-Quads parser throws an exception in case of syntax error.
     *
     * @throws - RangeError, if the complexity of the graph goes beyond the set complexity number. See {@link maximum_complexity_number}.
     *
     * @param input_dataset
     * @param copy - whether the input should be copied to a local store (e.g., if the input is a generator, or the uniqueness of quads are not guaranteed). If this
     * parameter is not used (i.e., value is `undefined`) the copy is always done _unless_ the input is an `rdf.DatasetCore` instance.
     * @returns - N-Quads document using the canonical ID-s.
     *
     * @async
     *
     */
    async canonicalize(input_dataset, copy = undefined) {
        return (await this.c14n(input_dataset, copy)).canonical_form;
    }
    /**
     * Canonicalize a Dataset producing the full set of information.
     *
     * Implementation of the main algorithmic steps, see
     * [separate overview in the spec](https://www.w3.org/TR/rdf-canon/#canon-algo-overview).
     *
     * (The real work is done in the [separate function](../functions/lib_canonicalization.computeCanonicalDataset.html)).
     *
     * The result is an Object containing the serialized version and the Quads version of the canonicalization result,
     * as well as a bnode mapping from the original to the canonical equivalents.
     *
     * @remarks
     * Note that the N-Quads parser throws an exception in case of syntax error.
     *
     * @throws - RangeError, if the complexity of the graph goes beyond the set complexity number. See {@link maximum_complexity_number}.
     *
     * @param input_dataset
     * @param copy - whether the input should be copied to a local store (e.g., if the input is a generator, or the uniqueness of quads are not guaranteed). If this
     * parameter is not used (i.e., value is `undefined`) the copy is always done _unless_ the input is an `rdf.DatasetCore` instance.
     * @returns - Detailed results of the canonicalization
     *
     * @async
     */
    async c14n(input_dataset, copy = undefined) {
        return (0, canonicalization_1.computeCanonicalDataset)(this.state, input_dataset, copy);
    }
    /**
     * Serialize a dataset into a (possibly sorted) Array of nquads.
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
     * 1. serialize the dataset into nquads and sort the result (unless the input is an N-Quads document);
     * 2. compute the hash of the concatenated nquads.
     *
     * This method is typically used on the result of the canonicalization to compute the canonical hash of a dataset.
     *
     * @param input_dataset
     * @returns
     */
    async hash(input_dataset) {
        if (typeof input_dataset === 'string') {
            return (0, common_1.computeHash)(this.state, input_dataset);
        }
        else {
            return (0, common_1.hashDataset)(this.state, input_dataset, true);
        }
    }
}
exports.RDFC10 = RDFC10;
//# sourceMappingURL=index.js.map