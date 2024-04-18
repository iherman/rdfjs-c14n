"use strict";
/**
 * Common types and minor utilities.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BnodeSet = exports.isQuads = exports.parseNquads = exports.hashDataset = exports.quadsToNquads = exports.quadToNquad = exports.hashNquads = exports.concatNquads = exports.computeHash = exports.BNODE_PREFIX = void 0;
const n3 = require("n3");
const event_emitter_promisify_1 = require("event-emitter-promisify");
const config_1 = require("./config");
/**
 * The prefix used for all generated canonical bnode IDs
 */
exports.BNODE_PREFIX = "c14n";
/***********************************************************
Various utility functions used by the rest of the code.
***********************************************************/
/**
 * Return the hash of a string.
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
 * Convert an array of nquad statements into a single N-Quads document:
 * this means concatenating all nquads into a long string. Care should be taken that each
 * quad must end with a single `/n` character (see [Canonical N-Quads specification](https://www.w3.org/TR/rdf12-n-quads/#canonical-quads)).
 *
 * @param nquads
 * @returns - N-Quads document as a string
 *
 */
function concatNquads(nquads) {
    return nquads.map((q) => q.endsWith('\n') ? q : `${q}\n`).join('');
}
exports.concatNquads = concatNquads;
/**
 * Return the hash of an array of N-Quads statements; per specification, this means
 * concatenating all nquads into a long string before hashing.
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
 * Serialize an `rdf.Quad` object into single nquad.
 *
 * @param quad
 * @returns - N-Quad string
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
 * sort them, and then hash the result.
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
 *
 * @param nquads
 * @returns parsed dataset
 */
async function parseNquads(nquads) {
    // This version of the function, relying on the streaming parser, has been
    // suggested by Jesse Wright(`@jeswr` on github).
    const store = new n3.Store();
    const parser = new n3.StreamParser({ blankNodePrefix: '' });
    const storeEventHandler = store.import(parser);
    parser.write(nquads);
    parser.end();
    await (0, event_emitter_promisify_1.promisifyEventEmitter)(storeEventHandler);
    return store;
}
exports.parseNquads = parseNquads;
/**
 * Type guard to see if an object implements the rdf.DatasetCore interface (a.k.a. Quads). If that is
 * indeed the case, then the object is considered as "safe": there are no repeated terms, and it is not
 * a generator, ie, it can be iterated on several times.
 *
 * Used at the very beginning of the algorithm, part of a function that stores the quads in a local (n3) data store. By
 * checking this, we can avoid unnecessary duplication of a dataset.
 */
function isQuads(obj) {
    // Having match is important, because all the other terms are also valid for a Set...
    return 'has' in obj && 'match' in obj && 'add' in obj && 'delete' in obj && 'size' in obj;
}
exports.isQuads = isQuads;
/**
 * Replacement of a `Set<rdf.BlankNode>` object: the build-in Set structure does not compare the RDF terms,
 * therefore does not filter out duplicate BNode instances.
 *
 * (Inspired by the TermSet class from  @rdfjs/term-set, which could not be used directly due to some
 * node.js+typescript issues. This version is stripped down to the strict minimum.)
 */
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
//# sourceMappingURL=common.js.map