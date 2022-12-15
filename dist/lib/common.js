"use strict";
/**
 * Common types and minor utilities.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatasetShell = exports.quadToNquad = exports.hashDataset = exports.sortAndHashNquads = exports.hashNquads = exports.computeHash = exports.Constants = void 0;
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
 * Return the hash of an array of nquad statements; per spec, this means
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
    const data = nquads.map((q) => q.endsWith('\n') ? q : `${q}\n`).join('');
    return computeHash(state, data);
}
exports.hashNquads = hashNquads;
/**
 * Return the hash of an array of nquad statements after being sorted. Per spec, this means
 * concatenating all nquads into a long string. Care should be taken that each
 * quad must end with a single `/n`.
 *
 * @param nquads
 * @returns
 */
function sortAndHashNquads(state, nquads) {
    nquads.sort();
    return hashNquads(state, nquads);
}
exports.sortAndHashNquads = sortAndHashNquads;
/**
 * Hash a dataset
 *
 * @param quads
 * @param sort - whether the quads must be sorted before hash. Defaults to `true`.
 * @returns
 */
function hashDataset(state, quads, sort = true) {
    const nquads = [];
    for (const quad of quads) {
        nquads.push(quadToNquad(quad));
    }
    if (sort)
        nquads.sort();
    return hashNquads(state, nquads);
}
exports.hashDataset = hashDataset;
/**
 * Return an nquad version for a single quad.
 *
 * @param quad
 * @returns
 */
function quadToNquad(quad) {
    const retval = (0, rdf_string_1.nquads) `${quad}`.toString();
    return retval.endsWith('  .') ? retval.replace(/  .$/, ' .') : retval;
}
exports.quadToNquad = quadToNquad;
/**
 * A shell to provide a unified way of handling the various ways a graph can be represented: a full blown
 * rdf.DatasetCore, or an array, or a Set of Quads.
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
    new(state) {
        if (Array.isArray(this.the_dataset)) {
            return new DatasetShell([]);
        }
        else if (this.the_dataset instanceof Set) {
            return new DatasetShell(new Set());
        }
        else {
            if (state.datasetFactory) {
                return new DatasetShell(state.datasetFactory.dataset());
            }
            else {
                return new DatasetShell(new Set());
            }
        }
    }
    get dataset() {
        return this.the_dataset;
    }
    /**
     * Iterate over the values in issuance order
     */
    *[Symbol.iterator]() {
        for (const quad of this.the_dataset) {
            yield quad;
        }
    }
}
exports.DatasetShell = DatasetShell;
