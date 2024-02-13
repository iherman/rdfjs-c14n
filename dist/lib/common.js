"use strict";
/**
 * Common types and minor utilities.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BnodeSet = exports.parseNquads = exports.hashDataset = exports.quadsToNquads = exports.quadToNquad = exports.hashNquads = exports.concatNquads = exports.computeHash = exports.Constants = void 0;
const n3 = require("n3");
const event_emitter_promisify_1 = require("event-emitter-promisify");
const config_1 = require("./config");
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
 * Return the hash of a string (encoded in UTF-8).
 *
 * This is the core of the various hashing functions. It is the interface to the Web Crypto API,
 * which does the effective calculations.
 *
 * @param input
 * @returns - hash value
 *
 * @async
 */
async function computeHash(state, input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest(config_1.AVAILABLE_HASH_ALGORITHMS[state.hash_algorithm], data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
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
 * @async
 *
 */
async function hashNquads(state, nquads) {
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
    const retval = n3Writer.quadToString(quad.subject, quad.predicate, quad.object, quad.graph);
    ;
    return retval.endsWith('  .') ? retval.replace(/  .$/, ' .') : retval;
}
exports.quadToNquad = quadToNquad;
const n3Writer = new n3.Writer();
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
 *
 * @async
 */
async function hashDataset(state, quads, sort = true) {
    const nquads = quadsToNquads(quads, sort);
    return hashNquads(state, nquads);
}
exports.hashDataset = hashDataset;
/**
 * Parse an nQuads document into a set of Quads.
 *
 * This version of the function, relying on the streaming parser, has been
 * suggested by Jesse Wright (`@jeswr` on github).
 *
 * @param nquads
 * @returns parsed dataset
 */
async function parseNquads(nquads) {
    const store = new n3.Store();
    const parser = new n3.StreamParser({ blankNodePrefix: '' });
    const storeEventHandler = store.import(parser);
    parser.write(nquads);
    parser.end();
    await (0, event_emitter_promisify_1.promisifyEventEmitter)(storeEventHandler);
    return store;
}
exports.parseNquads = parseNquads;
/** TypeScript version of the TermSet class found in @rdfjs/term-set  */
class BnodeSet {
    index;
    constructor() {
        this.index = new Map();
    }
    get size() {
        return this.index.size;
    }
    add(term) {
        const key = term.value;
        if (!this.index.has(key)) {
            this.index.set(key, term);
        }
        return this;
    }
    values() {
        return new Set(this.index.values());
    }
    keys() {
        return this.values();
    }
    [Symbol.iterator]() {
        return this.index.values();
    }
}
exports.BnodeSet = BnodeSet;
