"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeConfigData = void 0;
var node_process_1 = require("node:process");
var fs = require("node:fs");
var path = require("node:path");
var config = require("../lib/config");
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
function nodeConfigData() {
    // Read the configuration file; the env_name gives the base for the file name
    // It is a very small file, sync file read is used to make it simple...
    var get_config = function (env_name) {
        if (env_name in node_process_1.env) {
            var fname = path.join("".concat(node_process_1.env[env_name]), ".rdfjs_c14n.json");
            try {
                return JSON.parse(fs.readFileSync(fname, 'utf-8'));
            }
            catch (e) {
                return {};
            }
        }
        else {
            return {};
        }
    };
    // Create a configuration data for the environment variables (if any)
    var get_env_data = function () {
        var retval = {};
        if (config.ENV_COMPLEXITY in node_process_1.env)
            retval.c14n_complexity = Number(node_process_1.env[config.ENV_COMPLEXITY]);
        if (config.ENV_HASH_ALGORITHM in node_process_1.env)
            retval.c14n_hash = node_process_1.env[config.ENV_HASH_ALGORITHM];
        return retval;
    };
    var home_data = get_config("HOME");
    var local_data = get_config("PWD");
    var env_data = get_env_data();
    var sys_data = {
        c14n_complexity: config.DEFAULT_MAXIMUM_COMPLEXITY,
        c14n_hash: config.HASH_ALGORITHM,
    };
    var retval = {};
    // "Merge" all the configuration data in the right priority order
    Object.assign(retval, sys_data, home_data, local_data, env_data);
    // Sanity check of the data:
    if (!(retval.c14n_complexity !== undefined && Number.isNaN(retval.c14n_complexity) && retval.c14n_complexity > 0)) {
        retval.c14n_complexity = config.DEFAULT_MAXIMUM_COMPLEXITY;
    }
    if (!(retval.c14n_hash !== undefined && config.AVAILABLE_HASH_ALGORITHMS.includes(retval.c14n_hash))) {
        retval.c14n_hash = config.HASH_ALGORITHM;
    }
    return retval;
}
exports.nodeConfigData = nodeConfigData;
