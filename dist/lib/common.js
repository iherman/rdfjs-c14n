"use strict";
/**
 * Common types and minor utilities.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hash_nquads = exports.compute_hash = exports.get_bnodeid = exports.NopLogger = exports.Constants = void 0;
const crypto_1 = require("crypto");
var Constants;
(function (Constants) {
    /** The hashing algorithm's name used in the module */
    Constants.HASH_ALGORITHM = "sha256";
    /** The prefix used for all generated canonical bnode IDs */
    Constants.BNODE_PREFIX = "_:c14n";
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
 * Per RDF Interface specification, the BlankNode's "value" does not include the "_:",
 * whereas the C14 algorithm does. This function returns the value of a blank node's ID
 * preceded by the `_:`
 *
 * @param term
 * @returns
 */
function get_bnodeid(term) {
    return `_:${term.value}`;
}
exports.get_bnodeid = get_bnodeid;
/**
 * Return the hash of a string.
 *
 * @param data
 * @returns - hash value
 */
function compute_hash(data) {
    return (0, crypto_1.createHash)(Constants.HASH_ALGORITHM).update(data).digest('hex');
}
exports.compute_hash = compute_hash;
/**
 * Return the hash of an array of nquad statements; per spec, this means
 * concatenating all nquads into a long array. Care should be taken that each
 * quad must end with a single `/n`.
 *
 * @param nquads
 * @returns - hash value
 *
 */
function hash_nquads(nquads) {
    // It may be better to add to a hash the quads one by one and then make the calculation;
    // this is a possible optimization for another day...
    // Care should be taken that the final data to be hashed include a single `/n`
    // for every quad, before joining the quads into a string that must be hashed
    const data = nquads.map((q) => q.endsWith('\n') ? q : `${q}\n`).join('');
    return compute_hash(data);
}
exports.hash_nquads = hash_nquads;
