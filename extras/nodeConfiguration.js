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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeConfigData = nodeConfigData;
const node_process_1 = require("node:process");
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const config = __importStar(require("../lib/config"));
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
    const get_config = (env_name) => {
        if (env_name in node_process_1.env) {
            const fname = path.join(`${node_process_1.env[env_name]}`, ".rdfjs_c14n.json");
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
    const get_env_data = () => {
        const retval = {};
        if (config.ENV_COMPLEXITY in node_process_1.env)
            retval.c14n_complexity = Number(node_process_1.env[config.ENV_COMPLEXITY]);
        if (config.ENV_HASH_ALGORITHM in node_process_1.env)
            retval.c14n_hash = node_process_1.env[config.ENV_HASH_ALGORITHM];
        return retval;
    };
    const home_data = get_config("HOME");
    const local_data = get_config("PWD");
    const env_data = get_env_data();
    const sys_data = {
        c14n_complexity: config.DEFAULT_MAXIMUM_COMPLEXITY,
        c14n_hash: config.HASH_ALGORITHM,
    };
    let retval = {};
    // "Merge" all the configuration data in the right priority order
    Object.assign(retval, sys_data, home_data, local_data, env_data);
    // Sanity check of the data:
    if (retval.c14n_complexity === undefined || Number.isNaN(retval.c14n_complexity) || retval.c14n_complexity <= 0 || retval.c14n_complexity > config.DEFAULT_MAXIMUM_COMPLEXITY) {
        retval.c14n_complexity = config.DEFAULT_MAXIMUM_COMPLEXITY;
    }
    if (retval.c14n_hash === undefined || Object.keys(config.AVAILABLE_HASH_ALGORITHMS).includes(retval.c14n_hash.toLowerCase()) === false) {
        retval.c14n_hash = config.HASH_ALGORITHM;
    }
    return retval;
}
