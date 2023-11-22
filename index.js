"use strict";
/**
 * Implementation of the RDF Canonicalization Algorithm, published by the W3C RCH Working Group.
 * See [specification](https://www.w3.org/TR/rdf-canon/) for the latest official version.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RDFC10 = exports.LogLevels = void 0;
var n3 = require("n3");
var common_1 = require("./lib/common");
var config_1 = require("./lib/config");
var issueIdentifier_1 = require("./lib/issueIdentifier");
var canonicalization_1 = require("./lib/canonicalization");
var logging_1 = require("./lib/logging");
var logging_2 = require("./lib/logging");
Object.defineProperty(exports, "LogLevels", { enumerable: true, get: function () { return logging_2.LogLevels; } });
/**
 * Just a shell around the algorithm, consisting of a state, and the call for the real implementation.
 *
 * The variable parts of the state, as [defined in the spec](https://www.w3.org/TR/rdf-canon/#dfn-canonicalization-state),
 * are re-initialized at a call to the canonicalize call. Ie, the same class instance can be reused to
 * {@link RDFC10#canonicalize} for different graphs.
 */
var RDFC10 = /** @class */ (function () {
    /**
     * @constructor
     * @param data_factory  An implementation of the generic RDF DataFactory interface, see [the specification](http://rdf.js.org/data-model-spec/#datafactory-interface). If undefined, the DataFactory of the [n3 package](https://www.npmjs.com/package/n3) is used.
     * @param getConfigData A function returning the configuration data, see {@link ConfigData}. By default, this return the constant values set in the code; the caller may provide a more complex function to handle environment variables and/or configuration files
     */
    function RDFC10(data_factory, getConfigData) {
        var localGetConfigData = (getConfigData !== undefined && getConfigData !== null) ? getConfigData : config_1.defaultConfigData;
        var _a = localGetConfigData(), c14n_complexity = _a.c14n_complexity, c14n_hash = _a.c14n_hash;
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
     * Create and set a logger instance
     *
     * @param logger
     */
    RDFC10.prototype.setLogger = function (id, level) {
        if (id === void 0) { id = logging_1.LoggerFactory.DEFAULT_LOGGER; }
        if (level === void 0) { level = logging_1.LogLevels.debug; }
        var new_logger = logging_1.LoggerFactory.createLogger(id, level);
        if (new_logger !== undefined) {
            this.state.logger_id = id;
            this.state.logger = new_logger;
            return new_logger;
        }
        else {
            return undefined;
        }
    };
    Object.defineProperty(RDFC10.prototype, "logger_type", {
        /**
         * Current logger type
         */
        get: function () {
            return this.state.logger_id;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RDFC10.prototype, "available_logger_types", {
        /**
         * List of available logger types.
         */
        get: function () {
            return logging_1.LoggerFactory.loggerTypes();
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RDFC10.prototype, "hash_algorithm", {
        get: function () {
            return this.state.hash_algorithm;
        },
        /**
         * Set the Hash algorithm. The default is "sha256".
         * If the algorithm is available the value is ignored (and an exception is thrown).
         *
         * The name is considered to be case insensitive. Also, both the formats including, or not, the '-' characters
         * are accepted (i.e., "sha256" and "sha-256").
         *
         * @param algorithm_in: the (case insensitive) name of the algorithm,
         */
        set: function (algorithm_in) {
            // To avoid stupid case dependent misspellings...
            var algorithm = algorithm_in.toLowerCase();
            if (Object.keys(config_1.AVAILABLE_HASH_ALGORITHMS).includes(algorithm)) {
                this.state.hash_algorithm = algorithm;
            }
            else {
                var error_message = "\"".concat(algorithm_in, "\" is not a valid Hash Algorithm name");
                throw TypeError(error_message);
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RDFC10.prototype, "available_hash_algorithms", {
        /**
         * List of available hash algorithm names.
         */
        get: function () {
            return Object.keys(config_1.AVAILABLE_HASH_ALGORITHMS);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RDFC10.prototype, "maximum_complexity_number", {
        get: function () {
            return this.state.complexity_number;
        },
        /**
         * Set the maximal complexity number. This number, multiplied with the number of blank nodes in the dataset,
         * sets a maximum level of calls the algorithm can do for the so called "hash n degree quads" function.
         * Setting this number to a reasonably low number (say, 30),
         * ensures that some "poison graphs" would not result in an unreasonably long canonicalization process.
         * See the [security consideration section](https://www.w3.org/TR/rdf-canon/#security-considerations) in the specification.
         *
         * The default value set by this implementation is 50; any number _greater_ then this number is ignored (and an exception is thrown).
         */
        set: function (level) {
            if (!Number.isNaN(level) && Number.isInteger(level) && level > 0 && level < config_1.DEFAULT_MAXIMUM_COMPLEXITY) {
                this.state.complexity_number = level;
            }
            else {
                var error_message = "Required complexity must be between 0 and ".concat(config_1.DEFAULT_MAXIMUM_COMPLEXITY);
                throw RangeError(error_message);
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(RDFC10.prototype, "maximum_allowed_complexity_number", {
        /**
         * The system-wide maximum value for the recursion level. The current maximum recursion level cannot exceed this value.
         */
        get: function () {
            return config_1.DEFAULT_MAXIMUM_COMPLEXITY;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Canonicalize a Dataset into an N-Quads document.
     *
     * Implementation of the main algorithmic steps, see
     * [separate overview in the spec](https://www.w3.org/TR/rdf-canon/#canon-algo-overview).
     *
     * (The real work is done in the [separate function](../functions/lib_canonicalization.computeCanonicalDataset.html)).
     *
     * @remarks
     * Note that the N-Quads parser throws an exception in case of syntax error.
     *
     * @throws - RangeError, if the complexity of the graph goes beyond the set complexity number. See {@link maximum_complexity_number}
     *
     * @param input_dataset
     * @returns - N-Quads document using the canonical ID-s.
     *
     * @async
     *
     */
    RDFC10.prototype.canonicalize = function (input_dataset) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.c14n(input_dataset)];
                    case 1: return [2 /*return*/, (_a.sent()).canonical_form];
                }
            });
        });
    };
    /**
     * Canonicalize a Dataset producing the full set of information.
     *
     * Implementation of the main algorithmic steps, see
     * [separate overview in the spec](https://www.w3.org/TR/rdf-canon/#canon-algo-overview).
     *
     * (The real work is done in the [separate function](../functions/lib_canonicalization.computeCanonicalDataset.html)).
     *
     * The result is an Object containing the serialized version and the Quads version of the canonicalization result,
     * as well as a bnode mapping from the original to the canonical equivalents
     *
     * @remarks
     * Note that the N-Quads parser throws an exception in case of syntax error.
     *
     * @throws - RangeError, if the complexity of the graph goes beyond the set complexity number. See {@link maximum_complexity_number}
     *
     * @param input_dataset
     * @returns - Detailed results of the canonicalization
     *
     * @async
     */
    RDFC10.prototype.c14n = function (input_dataset) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, canonicalization_1.computeCanonicalDataset)(this.state, input_dataset)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Serialize a dataset into a (possibly sorted) Array of nquads.
     *
     * @param input_dataset
     * @param sort If `true` (the default) the array is lexicographically sorted
     * @returns
     */
    RDFC10.prototype.toNquads = function (input_dataset, sort) {
        if (sort === void 0) { sort = true; }
        return (0, common_1.quadsToNquads)(input_dataset, sort);
    };
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
    RDFC10.prototype.hash = function (input_dataset) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(typeof input_dataset === 'string')) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, common_1.computeHash)(this.state, input_dataset)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, (0, common_1.hashDataset)(this.state, input_dataset, true)];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return RDFC10;
}());
exports.RDFC10 = RDFC10;
