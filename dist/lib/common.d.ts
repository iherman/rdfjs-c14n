/**
 * Common types and minor utilities.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
import * as rdf from '@rdfjs/types';
import { IDIssuer } from './issueIdentifier';
import { Logger } from './logging';
/**
 * The prefix used for all generated canonical bnode IDs
 */
export declare const BNODE_PREFIX = "c14n";
/**
 * According to the RDF semantics, the correct representation of a dataset is a Set of Quads. That is
 * the structure used internally in the algorithm.
 */
export type Quads = rdf.DatasetCore;
/**
 * This is the external, "input" view of the dataset
 */
export type InputQuads = Iterable<rdf.Quad>;
export type InputDataset = InputQuads | string;
export type BNodeId = string;
export type Hash = string;
/**
 * BNode labels to Quads mapping. Used in the canonicalization state as the blank node to quad map. See
 * the [specification](https://www.w3.org/TR/rdf-canon/#canon-state).
 */
export interface BNodeToQuads {
    [index: BNodeId]: rdf.Quad[];
}
/**
 * Hash values to BNode labels mapping. Used in the canonicalization state as the hash to bnode map. See
 * the [specification](https://www.w3.org/TR/rdf-canon/#canon-state).
 */
export interface HashToBNodes {
    [index: Hash]: BNodeId[];
}
/**
 * Canonicalization result, i.e., the result structure of the algorithm.
 * See the [specification](https://www.w3.org/TR/rdf-canon/#ca.7)
 */
export interface C14nResult {
    /** N-Quads serialization of the dataset. */
    canonical_form: string;
    /** Dataset as a DatasetCore */
    canonicalized_dataset: Quads;
    /** Mapping of a blank node to its identifier. */
    bnode_identifier_map: ReadonlyMap<rdf.BlankNode, BNodeId>;
    /** Mapping of an (original) blank node id to its canonical equivalent. */
    issued_identifier_map: ReadonlyMap<BNodeId, BNodeId>;
}
/**
 * Canonicalization state. See
 * the [specification](https://www.w3.org/TR/rdf-canon/#canon-state). (The "hash algorithm" field has been
 * added to the state because the it can be parametrized.)
 */
export interface C14nState {
    bnode_to_quads: BNodeToQuads;
    hash_to_bnodes: HashToBNodes;
    canonical_issuer: IDIssuer;
    hash_algorithm: string;
}
/**
 * Extensions to the canonicalization state. These extensions are not defined by the specification, but are necessary to
 * run the code.
 *
 */
export interface GlobalState extends C14nState {
    /**
     * [RDF data factory instance](http://rdf.js.org/data-model-spec/#datafactory-interface), to be used
     * to create new terms and quads.
     */
    dataFactory: rdf.DataFactory;
    /** A logger instance */
    logger: Logger;
    /** Logger instance's identifier name */
    logger_id: string;
    /**
     * Complexity number: the multiplicative factor that
     * sets the value of {@link maximum_n_degree_call} by
     * multiplying it with the number of blank nodes
     */
    complexity_number: number;
    /**
     * Maximal number of recursions allowed.
     * This value may be modified by the caller
     */
    maximum_n_degree_call: number;
    /**
     * Current recursion level. Initialized to zero, increased every time a recursion occurs
     */
    current_n_degree_call: number;
}
/**
 * Return structure from a N-degree quad's hash computation, see [the specification](https://www.w3.org/TR/rdf-canon/#hash-nd-quads-algorithm).
 */
export interface NDegreeHashResult {
    hash: Hash;
    issuer: IDIssuer;
}
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
export declare function computeHash(state: C14nState, input: string): Promise<Hash>;
/**
 * Convert an array of nquad statements into a single N-Quads document:
 * this means concatenating all nquads into a long string. Care should be taken that each
 * quad must end with a single `/n` character (see [Canonical N-Quads specification](https://www.w3.org/TR/rdf12-n-quads/#canonical-quads)).
 *
 * @param nquads
 * @returns - N-Quads document as a string
 *
 */
export declare function concatNquads(nquads: string[]): string;
/**
 * Return the hash of an array of N-Quads statements; per specification, this means
 * concatenating all nquads into a long string before hashing.
 *
 * @param nquads
 * @returns - hash value
 * @async
 *
 */
export declare function hashNquads(state: C14nState, nquads: string[]): Promise<Hash>;
/**
 * Serialize an `rdf.Quad` object into single nquad.
 *
 * @param quad
 * @returns - N-Quad string
 */
export declare function quadToNquad(quad: rdf.Quad): string;
/**
 * Return a nquad serialization of a dataset. This is a utility that external user can use, the library
 * doesn't rely on it.
 *
 * @param quads
 * @param sort - whether the quads must be sorted before hash. Defaults to `true`.
 * @returns - array of nquads
 */
export declare function quadsToNquads(quads: InputQuads, sort?: boolean): string[];
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
export declare function hashDataset(state: C14nState, quads: InputQuads, sort?: boolean): Promise<Hash>;
/**
 * Parse an nQuads document into a set of Quads.
 *
 *
 * @param nquads
 * @returns parsed dataset
 */
export declare function parseNquads(nquads: string): Promise<InputQuads>;
/**
 * Type guard to see if an object implements the rdf.DatasetCore interface (a.k.a. Quads). If that is
 * indeed the case, then the object is considered as "safe": there are no repeated terms, and it is not
 * a generator, ie, it can be iterated on several times.
 *
 * Used at the very beginning of the algorithm, part of a function that stores the quads in a local (n3) data store. By
 * checking this, we can avoid unnecessary duplication of a dataset.
 */
export declare function isQuads(obj: any): obj is Quads;
/**
 * Replacement of a `Set<rdf.BlankNode>` object: the build-in Set structure does not compare the RDF terms,
 * therefore does not filter out duplicate BNode instances.
 *
 * (Inspired by the TermSet class from  @rdfjs/term-set, which could not be used directly due to some
 * node.js+typescript issues. This version is stripped down to the strict minimum.)
 */
export declare class BnodeSet {
    private index;
    constructor();
    get size(): number;
    add(term: rdf.BlankNode): this;
    values(): Set<rdf.BlankNode>;
    keys(): Set<rdf.BlankNode>;
    [Symbol.iterator](): IterableIterator<rdf.BlankNode>;
}
