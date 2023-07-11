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

import { env } from 'node:process';
import * as fs from 'node:fs';
import * as path from 'node:path';
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
export function nodeConfigData(): config.ConfigData {
    // Read the configuration file; the env_name gives the base for the file name
    // It is a very small file, sync file read is used to make it simple...
    const get_config = (env_name: string): config.ConfigData => {
        if (env_name in env) {
            const fname = path.join(`${env[env_name]}`, ".rdfjs_c14n.json");
            try {
                return JSON.parse(fs.readFileSync(fname, 'utf-8')) as config.ConfigData;
            } catch (e) {
                return {};
            }
        } else {
            return {};
        }
    };
    // Create a configuration data for the environment variables (if any)
    const get_env_data = (): config.ConfigData => {
        const retval: config.ConfigData = {};
        if (config.ENV_COMPLEXITY in env) retval.c14n_complexity = Number(env[config.ENV_COMPLEXITY]);
        if (config.ENV_HASH_ALGORITHM in env) retval.c14n_hash = env[config.ENV_HASH_ALGORITHM];
        return retval;
    };

    const home_data: config.ConfigData = get_config("HOME");
    const local_data: config.ConfigData = get_config("PWD");
    const env_data: config.ConfigData = get_env_data();
    const sys_data: config.ConfigData = {
        c14n_complexity: config.DEFAULT_MAXIMUM_COMPLEXITY,
        c14n_hash: config.HASH_ALGORITHM,
    };
    let retval: config.ConfigData = {};

    // "Merge" all the configuration data in the right priority order
    Object.assign(retval, sys_data, home_data, local_data, env_data);

    // Sanity check of the data:
    if ( !(retval.c14n_complexity !== undefined && Number.isNaN(retval.c14n_complexity) && retval.c14n_complexity > 0) ) {
        retval.c14n_complexity = config.DEFAULT_MAXIMUM_COMPLEXITY;
    }
    if ( !(retval.c14n_hash !== undefined && config.HASH_ALGORITHMS.includes(retval.c14n_hash)) ) {
        retval.c14n_hash = config.HASH_ALGORITHM;
    }

    return retval;
}
