"use strict";
/**
 * Common types and minor utilities.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseNquads = exports.hashDataset = exports.quadsToNquads = exports.quadToNquad = exports.hashNquads = exports.concatNquads = exports.computeHash = exports.Constants = void 0;
const n3 = require("n3");
const CryptoJS = require("crypto-js");
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
    // Unfortunately, the mapping from a string to the function is not
    // clear. Doing this manually for now...
    const hash = (name, data) => {
        switch (name) {
            case "SHA1": return CryptoJS.SHA1(data);
            case "SHA224": return CryptoJS.SHA224(data);
            case "SHA512": return CryptoJS.SHA512(data);
            case "SHA3": return CryptoJS.SHA3(data);
            case "MD5": return CryptoJS.MD5(data);
            case "RIPEMD160": return CryptoJS.RIPEMD160(data);
            case "SHA256":
            default:
                return CryptoJS.SHA256(data);
        }
    };
    const hash_value = hash(state.hash_algorithm, data);
    return hash_value.toString();
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
