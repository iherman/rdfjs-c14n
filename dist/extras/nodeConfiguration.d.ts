/**
 * Environment extraction function that can be used to extract configuration data. This function can be used
 * in application that rely on node.js.
 *
 * Here is the way it can be used:
 *
 * ```
 * const rdfc10 = new RDFC10(null, nodeConfigData);
 * ```
 *
 * (the first `null` value stands for the DataFactory instance, unless the application uses a non-default one).
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
import * as config from '../lib/config';
/**
 * Handling the configuration data that the user can use, namely:
 *
 * - `$HOME/.rdfjs_c14n.json` following {@link config.ConfigData}
 * - `$PWD/.rdfjs_c14n.json` following {@link config.ConfigData}
 * - Environment variables `c14_complexity` and/or `c14n_hash`
 *
 * (in increasing priority order).
 *
 * If no configuration is set, and/or the values are invalid, the default values are used.
 *
 */
export declare function nodeConfigData(): config.ConfigData;
