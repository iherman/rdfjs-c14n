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
 * List of available hash algorithms defined by the WebCrypto API standard as of November 2021.
 * The user has the possibility to change the hash algorithm to be used instead of the
 * default one.
 *
 * Note that the list includes the alternative formats with or without the '-' character,
 * and the interface function for setting the algorithm is case insensitive.
 *
 * @readonly
 *
 */
exports.AVAILABLE_HASH_ALGORITHMS = {
    "sha1": "SHA-1",
    "sha256": "SHA-256",
    "sha384": "SHA-384",
    "sha512": "SHA-256",
    "sha-1": "SHA-1",
    "sha-256": "SHA-256",
    "sha-384": "SHA-384",
    "sha-512": "SHA-256",
};
/**
 * Environment variable to set/change the maximum complexity
 *
 * @readonly
 *
 */
exports.ENV_COMPLEXITY = "c14n_complexity";
/**
 * Environment variable to set/change the default hash algorithm
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
