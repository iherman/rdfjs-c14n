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
 * the `computeNDegreeHash` function can be called (this function is invoked
 * in only a few cases when there two blank nodes get the same hash value in the
 * first pass of the algorithm but, then, the call may become recursive).
 *
 * Setting this number to a reasonably low number,
 * ensures that some "poison graphs" would not result in an unreasonably long canonicalization process.
 * See the [security consideration section](https://www.w3.org/TR/rdf-canon/ #security-considerations)
 * in the specification.
 *
 *
 */
export declare const DEFAULT_MAXIMUM_COMPLEXITY = 50;
/**
 * The default hash algorithm's name. If changed, it should be one of the keys in the
 * separate {@link AVAILABLE_HASH_ALGORITHMS} object.
 *
 * Care should be taken if changing this constant. The formal specification of RDFC-1.0
 * _requires_ the value of "SHA256". If a different hash function is used, the
 * canonicalization results will not be interoperable with other implementations/installations.
 *
 *
 */
export declare const HASH_ALGORITHM = "sha256";
/**
 * List of available hash algorithms defined by the WebCrypto API standard as of November 2021.
 * The user has the possibility to change the hash algorithm to be used instead of the
 * default sha256.
 *
 * Note that the list includes the alternative formats with or without the '-' character,
 * and the interface function for setting the algorithm is case insensitive.
 *
 *
 */
export declare const AVAILABLE_HASH_ALGORITHMS: Record<string, string>;
/**
 * Environment variable to set/change the maximum complexity
 *
 *
 */
export declare const ENV_COMPLEXITY = "c14n_complexity";
/**
 * Environment variable to set/change the default hash algorithm
 */
export declare const ENV_HASH_ALGORITHM = "c14n_hash";
/**
 * Configuration data.
 */
export interface ConfigData {
    /**
     * Default (and maximal) complexity number. This will overwrite the value specified in
     * {@link DEFAULT_MAXIMUM_COMPLEXITY}.
     */
    c14n_complexity?: number;
    /** Hash algorithm. The value must be one of the algorithms listed in {@link AVAILABLE_HASH_ALGORITHMS}. */
    c14n_hash?: string;
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
export declare function defaultConfigData(): ConfigData;
