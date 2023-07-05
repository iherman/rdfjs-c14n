"use strict";
/**
 * Configuration constants. System administrators may want to modify these parameters,
 * although they should do it with care.
 *
 * To handle the configuration data that the user can use, namely:
 *
 * - `$HOME/.rdfjs_c14n.json` following {@link ConfigData}
 * - `$PWD/.rdfjs_c14n.json` following {@link ConfigData}
 * - Environment variables `c14_complexity` and/or `c14n_hash` (see {@link ENV_COMPLEXITY} and {@link ENV_HASH_ALGORITHM})
 *
 * (in increasing priority order).
 *
 * If no configuration is set, and/or the values are invalid, the default values are used.
*
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV_HASH_ALGORITHM = exports.ENV_COMPLEXITY = exports.HASH_ALGORITHMS = exports.HASH_ALGORITHM = exports.DEFAULT_MAXIMUM_COMPLEXITY = void 0;
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
exports.DEFAULT_MAXIMUM_COMPLEXITY = 50;
/**
 * The default hash algorithm's name. If changed, it should be one of the names in the
 * separate {@link HASH_ALGORITHMS} list.
 *
 * Care should be taken if changing this constant. The formal specification of RDFC-1.0
 * _requires_ the value of "sha256". If a different hash function is used, the
 * canonicalization results will not be interoperable with other implementations/installations.
 *
 * @readonly
 *
 */
exports.HASH_ALGORITHM = "sha256";
/**
 * List of available OpenSSL hash algorithms, as of June 2023 (`node.js` version 18.16.0).
 * The user has the possibility to change the hash algorithm, to be used without the
 * default one.
 *
 * This list has been checked to work with the algorithm.
 *
 */
exports.HASH_ALGORITHMS = [
    "blake2b512", "blake2s256", "md5", "rmd160",
    "sha1", "sha224", "sha256", "sha3-224",
    "sha3-256", "sha3-384", "sha3-512", "sha384",
    "sha512", "sha512-224", "sha512-256", "shake128",
    "shake256", "sm3",
];
/**
 * Environment variable to set/change the maximum complexity
 */
exports.ENV_COMPLEXITY = "c14n_complexity";
/**
 * Environment variable to set/change the maximum complexity
 */
exports.ENV_HASH_ALGORITHM = "c14n_hash";
// /**
//  * Handling the configuration data that the user can use, namely:
//  * 
//  * - `$HOME/.rdfjs_c14n.json` following {@link ConfigData}
//  * - `$PWD/.rdfjs_c14n.json` following {@link ConfigData}
//  * - Environment variables `c14_complexity` and/or `c14n_hash`
//  * 
//  * (in increasing priority order).
//  * 
//  * If no configuration is set, and/or the values are invalid, the default values are used.
//  * 
//  * @returns 
//  */
// export function configData(): ConfigData {
//     const get_config = (env_name: string): ConfigData => {
//         if (env_name in env) {
//             const fname = path.join(`${env[env_name]}`,".rdfjs_c14n.json");
//             console.log(fname);
//             try {
//                 return JSON.parse(fs.readFileSync(fname,'utf-8')) as ConfigData;
//             } catch(e) {
//                 console.error(e.message)
//                 return {};
//             }
//         } else {
//             return {};
//         }
//     };
//     const get_env_data = () : ConfigData => {
//         const retval: ConfigData = {};
//         if (ENV_COMPLEXITY in env) retval.c14n_complexity = Number(env[ENV_COMPLEXITY]);
//         if (ENV_HASH_ALGORITHM in env) retval.c14n_hash = env[ENV_HASH_ALGORITHM];
//         return retval;
//     };
//     const home_data: ConfigData  = get_config("HOME");
//     const local_data: ConfigData = get_config("PWD");
//     const env_data: ConfigData   = get_env_data();
//     const sys_data: ConfigData   = {
//         c14n_complexity : DEFAULT_MAXIMUM_COMPLEXITY,
//         c14n_hash       : HASH_ALGORITHM,
//     }
//     let retval: ConfigData = {};
//     console.log(`home:     ${JSON.stringify(home_data)}`);
//     console.log(`local:    ${JSON.stringify(local_data)}`);
//     console.log(`env:      ${JSON.stringify(env_data)}`);
//     console.log(`sys data: ${JSON.stringify(sys_data)}`)
//     console.log('');
//     Object.assign(retval, sys_data, home_data, local_data, env_data)
//     // Sanity check of the data:
//     if (Number.isNaN(retval.c14n_complexity) || retval.c14n_complexity <= 0) {
//         retval.c14n_complexity = DEFAULT_MAXIMUM_COMPLEXITY;
//     }
//     if (!HASH_ALGORITHMS.includes(retval.c14n_hash)) {
//         retval.c14n_hash = HASH_ALGORITHM;
//     }
//     console.log(`return:   ${JSON.stringify(retval)}`);
//     return retval;
// }
