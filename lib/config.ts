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

/**
 * Default maximal complexity value. Algorithmically, this number is multiplied
 * with the number of bnodes in a given dataset, thereby yielding the maximum times
 * the `computeNDegreeHash` function can be called (this function is invoked)
 * in only a few cases when there two blank nodes get the same hash value in the
 * first pass of the algorithm. 
 * 
 * Setting this number to a reasonably low number (say, 30),
 * ensures that some "poison graphs" would not result in an unreasonably long canonicalization process.
 * See the [security consideration section](https://www.w3.org/TR/rdf-canon/ #security-considerations)
 * in the specification.
 *
 * @readonly
 * 
 */
export const DEFAULT_MAXIMUM_COMPLEXITY = 50;

/** 
 * The default hash algorithm's name. If changed, it should be one of the names in the 
 * separate {@link HASH_ALGORITHMS} list.
 * 
 * Care should be taken if changing this constant. The formal specification of RDFC-1.0
 * _requires_ the value of "SHA256". If a different hash function is used, the 
 * canonicalization results will not be interoperable with other implementations/installations. 
 * 
 * @readonly
 * 
 */
export const HASH_ALGORITHM = "SHA256";

/**
 * List of available OpenSSL hash algorithms, as of June 2023 (`node.js` version 18.16.0).
 * The user has the possibility to change the hash algorithm, to be used without the
 * default one.
 * 
 * This list has been checked to work with the algorithm.
 * 
 */
export const HASH_ALGORITHMS = [
    "SHA1", "SHA256", "SHA224", "SHA384", "SHA512", "SHA3", "RIPEMD160", "MD5"
];

/**
 * Environment variable to set/change the maximum complexity
 */
export const ENV_COMPLEXITY = "c14n_complexity";

/**
 * Environment variable to set/change the maximum complexity
 */
export const ENV_HASH_ALGORITHM = "c14n_hash";


/**
 * Interface for the configuration data format
 */
export interface ConfigData {
    /** Number must be positive */
    c14n_complexity?: number,

    /** The value must be one of the algorithms listed in {@link HASH_ALGORITHMS} */
    c14n_hash?: string,
}

/**
 * Function type to return config data
 */
export type GetConfigData = () => ConfigData;

/**
 * A default callback, returning the built-in configuration data. Application developers may 
 * create an alternative callback with a more user-friendly way to set the configuration values.
 * 
 * @returns 
 */
export function defaultConfigData(): ConfigData {
    return {
        c14n_complexity: DEFAULT_MAXIMUM_COMPLEXITY,
        c14n_hash: HASH_ALGORITHM,
    };
}

