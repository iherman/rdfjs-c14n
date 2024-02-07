/**
 * Common types and minor utilities.
 * 
 * @copyright Ivan Herman 2023
 * 
 * @packageDocumentation
 */

import * as rdf from 'rdf-js';
import * as n3 from 'n3';

import { IDIssuer }        from './issueIdentifier';
import { nquads }          from '@tpluscode/rdf-string';
import { Logger }          from './logging';
import { AVAILABLE_HASH_ALGORITHMS } from './config';

export namespace Constants {
    /** 
     * The prefix used for all generated canonical bnode IDs 
     * 
     * @readonly
     * 
     */
    export const BNODE_PREFIX = "c14n";
}

/** 
 * According to the RDF semantics, the correct representation of a dataset is a Set of Quads.
 */
export type Quads = Set<rdf.Quad>;

/*
 * Per spec, the input can be an abstract dataset (ie, Quads, either as a set or an array) or an N-Quads document (ie, a string)
 */
export type InputDataset = Quads | rdf.Quad[] | string;
export type BNodeId      = string;
export type Hash         = string;
export type QuadToNquad  = (quad: rdf.Quad) => string;

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
 * Canonicalization result, ie, the result structure of the algorithm. 
 */
export interface C14nResult {
    /** N-Quads serialization of the dataset */
    canonical_form: string;

    /** Dataset as Set or Array of rdf Quads */
    canonicalized_dataset: Quads | rdf.Quad[];

    /** Mapping of a blank node to its identifier */
    bnode_identifier_map: ReadonlyMap<rdf.BlankNode, BNodeId>;

    /** Mapping of an (original) blank node id to its canonical equivalent */
    issued_identifier_map: ReadonlyMap<BNodeId, BNodeId>;
}

/**
 * Canonicalization state. See
 * the [specification](https://www.w3.org/TR/rdf-canon/#canon-state).
 * 
 * The "hash algorithm" field has been added to the state because the algorithm can be parametrized.
 */
export interface C14nState {
    bnode_to_quads: BNodeToQuads;
    hash_to_bnodes: HashToBNodes;
    canonical_issuer: IDIssuer;
    hash_algorithm: string;
}

/**
 * Extensions to the state. These extensions are not defined by the specification, but are necessary to
 * run the code
 * 
 * @remarks
 * The class instances in this extension are necessary to create/modify RDF terms, or to provide logging. These instances
 * reflect the underlying RDF environment that uses this module; the algorithm itself depends on standard RDF interfaces only.
 */
export interface GlobalState extends C14nState {
    /** 
     * [RDF data factory instance](http://rdf.js.org/data-model-spec/#datafactory-interface), to be used to create new terms and quads 
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
export async function computeHash(state: C14nState, input: string): Promise<Hash> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);

    const hashBuffer = await crypto.subtle.digest(AVAILABLE_HASH_ALGORITHMS[state.hash_algorithm], data);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex
}

/**
 * Return a single N-Quads document out of an array of nquad statements. Per specification, 
 * this means concatenating all nquads into a long string. Care should be taken that each
 * quad must end with a single `/n`.
 * 
 * @param nquads
 * @returns - hash value
 * 
 */
export function concatNquads(nquads: string[]): string {
    return nquads.map((q: string): string => q.endsWith('\n') ? q : `${q}\n`).join('');
}

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
export async function hashNquads(state: C14nState, nquads: string[]): Promise<Hash> {
    // Care should be taken that the final data to be hashed include a single `/n`
    // for every quad, before joining the quads into a string that must be hashed
    return computeHash(state, concatNquads(nquads));
}

/**
 * Return an nquad version for a single quad.
 * 
 * @param quad 
 * @returns - nquad
 */
export function quadToNquad(quad: rdf.Quad): string {
    const retval = nquads`${quad}`.toString();
    return retval.endsWith('  .') ? retval.replace(/  .$/, ' .') : retval;
}

/**
 * Return a nquad serialization of a dataset. This is a utility that external user can use, the library
 * doesn't rely on it.
 * 
 * @param quads 
 * @param sort - whether the quads must be sorted before hash. Defaults to `true`.
 * @returns - array of nquads
 */
export function quadsToNquads(quads: Iterable<rdf.Quad>, sort: boolean = true): string[] {
    const retval: string[] = [];
    for (const quad of quads) {
        retval.push(quadToNquad(quad));
    }
    if (sort) retval.sort();
    return retval;
}

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
export async function hashDataset(state: C14nState, quads: Iterable<rdf.Quad>, sort: boolean = true): Promise<Hash> {
    const nquads: string[] = quadsToNquads(quads, sort);
    return hashNquads(state, nquads);
}

/**
 * Parse an nQuads document into a set of Quads
 * 
 * @param nquads 
 * @returns parsed dataset
 */
export function parseNquads(nquads: string): Quads {
    const parser = new n3.Parser({ blankNodePrefix: '' });
    const quads: rdf.Quad[] = parser.parse(nquads);
    return new Set<rdf.Quad>(quads);
}
