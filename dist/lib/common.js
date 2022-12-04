"use strict";
/**
 * Common types and minor utilities.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.quad_to_nquad = exports.hash_dataset = exports.sort_and_hash_nquads = exports.hash_nquads = exports.compute_hash = exports.NopLogger = exports.Constants = void 0;
const crypto_1 = require("crypto");
const rdf_string_1 = require("@tpluscode/rdf-string");
var Constants;
(function (Constants) {
    /** The hashing algorithm's name used in the module */
    Constants.HASH_ALGORITHM = "sha256";
    /** The prefix used for all generated canonical bnode IDs */
    Constants.BNODE_PREFIX = "c14n";
})(Constants = exports.Constants || (exports.Constants = {}));
/**
 * A default, no-operation logger instance, used by default.
 */
class NopLogger {
    debug(message, ...otherData) { }
    ;
    warn(message, ...otherData) { }
    ;
    error(message, ...otherData) { }
    ;
    info(message, ...otherData) { }
    ;
}
exports.NopLogger = NopLogger;
/**
 * Return the hash of a string.
 *
 * @param data
 * @param algorithm - Hash algorithm to use. the value can be anything that the underlying openssl environment accepts, defaults to sha256.
 * @returns - hash value
 */
function compute_hash(data, algorithm = Constants.HASH_ALGORITHM) {
    return (0, crypto_1.createHash)(algorithm).update(data).digest('hex');
}
exports.compute_hash = compute_hash;
/**
 * Return the hash of an array of nquad statements; per spec, this means
 * concatenating all nquads into a long string. Care should be taken that each
 * quad must end with a single `/n`.
 *
 * @param nquads
 * @param algorithm - Hash algorithm to use. the value can be anything that the underlying openssl environment accepts, defaults to sha256.
 * @returns - hash value
 *
 */
function hash_nquads(nquads, algorithm = Constants.HASH_ALGORITHM) {
    // Care should be taken that the final data to be hashed include a single `/n`
    // for every quad, before joining the quads into a string that must be hashed
    const data = nquads.map((q) => q.endsWith('\n') ? q : `${q}\n`).join('');
    return compute_hash(data, algorithm);
}
exports.hash_nquads = hash_nquads;
/**
 * Return the hash of an array of nquad statements after being sorted. Per spec, this means
 * concatenating all nquads into a long string. Care should be taken that each
 * quad must end with a single `/n`.
 *
 * @param nquads
 * @param algorithm - Hash algorithm to use. the value can be anything that the underlying openssl environment accepts, defaults to sha256.
 * @returns
 */
function sort_and_hash_nquads(nquads, algorithm = Constants.HASH_ALGORITHM) {
    nquads.sort();
    return hash_nquads(nquads, algorithm);
}
exports.sort_and_hash_nquads = sort_and_hash_nquads;
/**
 * Hash a dataset
 * @param quads
 * @param sort - whether the quads must be sorted before hash. Defaults to `true`
 * @param algorithm - Hash algorithm to use. the value can be anything that the underlying openssl environment accepts, defaults to sha256.
 * @returns
 */
function hash_dataset(quads, sort = true, algorithm = Constants.HASH_ALGORITHM) {
    const nquads = [];
    for (const quad of quads) {
        nquads.push(quad_to_nquad(quad));
    }
    if (sort)
        nquads.sort();
    return hash_nquads(nquads, algorithm);
}
exports.hash_dataset = hash_dataset;
/**
 * Return an nquad version for a single quad.
 *
 * @param quad
 * @returns
 */
function quad_to_nquad(quad) {
    const retval = (0, rdf_string_1.nquads) `${quad}`.toString();
    return retval.endsWith('  .') ? retval.replace(/  .$/, ' .') : retval;
}
exports.quad_to_nquad = quad_to_nquad;
