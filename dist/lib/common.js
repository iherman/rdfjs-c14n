"use strict";
/**
 * Common types and minor utilities.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.configData = exports.parseNquads = exports.hashDataset = exports.quadsToNquads = exports.quadToNquad = exports.hashNquads = exports.concatNquads = exports.computeHash = exports.Constants = void 0;
const n3 = require("n3");
const node_crypto_1 = require("node:crypto");
const node_process_1 = require("node:process");
const fs = require("node:fs");
const path = require("node:path");
const config = require("./config");
const rdf_string_1 = require("@tpluscode/rdf-string");
var Constants;
(function (Constants) {
    /**
     * The prefix used for all generated canonical bnode IDs
     *
     * @readonly
     *
     */
    Constants.BNODE_PREFIX = "c14n";
})(Constants || (exports.Constants = Constants = {}));
/***********************************************************
Various utility functions used by the rest of the code.
***********************************************************/
/**
 * Return the hash of a string.
 *
 * @param data
 * @returns - hash value
 */
function computeHash(state, data) {
    return (0, node_crypto_1.createHash)(state.hash_algorithm).update(data).digest('hex');
}
exports.computeHash = computeHash;
/**
 * Return a single N-Quads document out of an array of nquad statements. Per specification,
 * this means concatenating all nquads into a long string. Care should be taken that each
 * quad must end with a single `/n`.
 *
 * @param nquads
 * @returns - hash value
 *
 */
function concatNquads(nquads) {
    return nquads.map((q) => q.endsWith('\n') ? q : `${q}\n`).join('');
}
exports.concatNquads = concatNquads;
/**
 * Return the hash of an array of nquad statements; per specification, this means
 * concatenating all nquads into a long string. Care should be taken that each
 * quad must end with a single `/n`.
 *
 * @param nquads
 * @returns - hash value
 *
 */
function hashNquads(state, nquads) {
    // Care should be taken that the final data to be hashed include a single `/n`
    // for every quad, before joining the quads into a string that must be hashed
    return computeHash(state, concatNquads(nquads));
}
exports.hashNquads = hashNquads;
/**
 * Return an nquad version for a single quad.
 *
 * @param quad
 * @returns - nquad
 */
function quadToNquad(quad) {
    const retval = (0, rdf_string_1.nquads) `${quad}`.toString();
    return retval.endsWith('  .') ? retval.replace(/  .$/, ' .') : retval;
}
exports.quadToNquad = quadToNquad;
/**
 * Return a nquad serialization of a dataset. This is a utility that external user can use, the library
 * doesn't rely on it.
 *
 * @param quads
 * @param sort - whether the quads must be sorted before hash. Defaults to `true`.
 * @returns - array of nquads
 */
function quadsToNquads(quads, sort = true) {
    const retval = [];
    for (const quad of quads) {
        retval.push(quadToNquad(quad));
    }
    if (sort)
        retval.sort();
    return retval;
}
exports.quadsToNquads = quadsToNquads;
/**
 * Hash a dataset. This is done by turning each quad into a nquad, concatenate them, possibly
 * store them, and then hash the result.
 *
 * @param quads
 * @param sort - whether the quads must be sorted before hash. Defaults to `true`.
 * @returns - hash value
 */
function hashDataset(state, quads, sort = true) {
    const nquads = quadsToNquads(quads, sort);
    return hashNquads(state, nquads);
}
exports.hashDataset = hashDataset;
/**
 * Parse an nQuads document into a set of Quads
 *
 * @param nquads
 * @returns parsed dataset
 */
function parseNquads(nquads) {
    const parser = new n3.Parser({ blankNodePrefix: '' });
    const quads = parser.parse(nquads);
    return new Set(quads);
}
exports.parseNquads = parseNquads;
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
 * @returns
 */
function configData() {
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
    if (Number.isNaN(retval.c14n_complexity) || retval.c14n_complexity <= 0) {
        retval.c14n_complexity = config.DEFAULT_MAXIMUM_COMPLEXITY;
    }
    if (!config.HASH_ALGORITHMS.includes(retval.c14n_hash)) {
        retval.c14n_hash = config.HASH_ALGORITHM;
    }
    return retval;
}
exports.configData = configData;
