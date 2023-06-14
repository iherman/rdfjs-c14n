"use strict";
/**
 * Common types and minor utilities.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatasetShell = exports.parseNquads = exports.hashDataset = exports.quadsToNquads = exports.quadToNquad = exports.hashNquads = exports.concatNquads = exports.computeHash = exports.Constants = void 0;
const n3 = require("n3");
const crypto_1 = require("crypto");
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
    /**
     * The default hash algorithm's name
     *
     * @readonly
     *
     */
    Constants.HASH_ALGORITHM = "sha256";
    /**
     * Default maximal value for recursion
     *
     * @readonly
     *
     */
    Constants.DEFAULT_MAXIMUM_RECURSION = 50;
    /**
     * List of available OpenSSL hash algorithms, as of June 2023 (`node.js` version 18.16.0).
     *
     */
    Constants.HASH_ALGORITHMS = [
        "blake2b512", "blake2s256", "md5", "rmd160",
        "sha1", "sha224", "sha256", "sha3-224",
        "sha3-256", "sha3-384", "sha3-512", "sha384",
        "sha512", "sha512-224", "sha512-256", "shake128",
        "shake256", "sm3",
    ];
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
    return (0, crypto_1.createHash)(state.hash_algorithm).update(data).digest('hex');
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
 * A shell to provide a unified way of handling the various ways a graph can be represented: a full blown
 * [RDF Dataset core instance](https://rdf.js.org/dataset-spec/#datasetcore-interface), an Array of Quads, or a Set of Quads.
 *
 * @remarks
 * The reason this class is necessary is (1) the Array object in JS does not have a `add`
 * property and (2) care should be taken about creating new RDF Datasets to reproduce the same "choice" for Quads
 * (see the {@link new} method).
 */
class DatasetShell {
    the_dataset;
    constructor(dataset) {
        this.the_dataset = dataset;
    }
    add(quad) {
        if (Array.isArray(this.the_dataset)) {
            this.the_dataset.push(quad);
        }
        else {
            this.the_dataset.add(quad);
        }
    }
    /**
     * Create a new instance whose exact type reflects the current type.
     *
     * @param state
     * @returns - a new (empty) dataset
     */
    new() {
        if (Array.isArray(this.the_dataset)) {
            return new DatasetShell([]);
        }
        else {
            return new DatasetShell(new Set());
        }
    }
    get dataset() {
        return this.the_dataset;
    }
    /**
     * Iterate over the quads
     */
    *[Symbol.iterator]() {
        for (const quad of this.the_dataset) {
            yield quad;
        }
    }
}
exports.DatasetShell = DatasetShell;
