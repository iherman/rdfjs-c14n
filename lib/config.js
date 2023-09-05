"use strict";
/**
 * Configuration constants. System administrators may want to modify these parameters,
 * although they should do it with care.
 *
 * Applications relying on the library may provide a callback to modify the configuration data. The `extras` directory
 * on the [github repository](https://github.com/iherman/rdfjs-c14n) includes such a callback for the `node.js` platform.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfigData = exports.ENV_HASH_ALGORITHM = exports.ENV_COMPLEXITY = exports.AVAILABLE_HASH_ALGORITHMS = exports.HASH_ALGORITHM = exports.DEFAULT_MAXIMUM_COMPLEXITY = void 0;
var CryptoJS = require("crypto-js");
/**
 * Default maximal complexity value. Algorithmically, this number is multiplied
 * with the number of bnodes in a given dataset, thereby yielding the maximum times
 * the `computeNDegreeHash` function can be called (this function is invoked
 * in only a few cases when there two blank nodes get the same hash value in the
 * first pass of the algorithm).
 *
 * Setting this number to a reasonably low number (say, 30),
 * ensures that some "poison graphs" would not result in an unreasonably long canonicalization process.
 * See the [security consideration section](https://www.w3.org/TR/rdf-canon/ #security-considerations)
 * in the specification.
 *
 * @readonly
 *
 */
exports.DEFAULT_MAXIMUM_COMPLEXITY = 50;
/**
 * The default hash algorithm's name. If changed, it should be one of the keys in the
 * separate {@link AVAILABLE_HASH_ALGORITHMS} object.
 *
 * Care should be taken if changing this constant. The formal specification of RDFC-1.0
 * _requires_ the value of "SHA256". If a different hash function is used, the
 * canonicalization results will not be interoperable with other implementations/installations.
 *
 * @readonly
 *
 */
exports.HASH_ALGORITHM = "sha256";
/**
 * List of available hash algorithms, as of August 2023 in the crypto-js library.
 * The user has the possibility to change the hash algorithm to be used instead of the
 * default one.
 *
 * At installation the available choices can be reduced to, e.g., sha256 and sha384. Also,
 * if crypto-js evolves and new functions are be added, this can be added to the structure
 * below if needed.
 *
 * @readonly
 *
 * This list has been checked to work with the algorithm.
 *
 */
exports.AVAILABLE_HASH_ALGORITHMS = {
    "md5": CryptoJS.MD5,
    "sha1": CryptoJS.SHA1,
    "sha256": CryptoJS.SHA256,
    "sha224": CryptoJS.SHA224,
    "sha384": CryptoJS.SHA384,
    "sha512": CryptoJS.SHA512,
    "ripemd160": CryptoJS.RIPEMD160,
    "sha3": CryptoJS.SHA3,
};
/**
 * Environment variable to set/change the maximum complexity
*
 * @readonly
 *
*
 * @readonly
 *
 */
exports.ENV_COMPLEXITY = "c14n_complexity";
/**
 * Environment variable to set/change the maximum complexity
 */
exports.ENV_HASH_ALGORITHM = "c14n_hash";
/**
 * A default callback, returning the built-in configuration data. Application developers may
 * create an alternative callback with a more user-friendly way to set the configuration values.
 *
 * @returns
 */
function defaultConfigData() {
    return {
        c14n_complexity: exports.DEFAULT_MAXIMUM_COMPLEXITY,
        c14n_hash: exports.HASH_ALGORITHM,
    };
}
exports.defaultConfigData = defaultConfigData;
