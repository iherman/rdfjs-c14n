import * as rdf       from 'rdf-js';
import { createHash } from 'crypto';
import { IdIssuer }   from './issue_identifier';

export namespace Constants {
    /** The hashing algorithm's name used in the module */
    export const HASH_ALGORITHM = "sha256";

    /** The prefix used for all generated canonical bnode IDs */
    export const BNODE_PREFIX = "_:c14n";
}

export type Graph       = Set<rdf.Quad>;
export type BNodeId     = string;
export type Hash        = string;
export type QuadToNquad = (quad: rdf.Quad) => string;

// Relates a bnode to those quads in which it appears
export interface BNodeToQuads {
    [index: BNodeId] : rdf.Quad[];
}

export interface HashToBNodes {
    [index: Hash] : BNodeId[];
}

/**
 * This is the Canonicalization State, as defined in the spec.
 */
export interface C14nState {
    bnode_to_quads   : BNodeToQuads;
    hash_to_bnodes   : HashToBNodes;
    canonical_issuer : IdIssuer;
}

/**
 * These are the two functions/classes that must be implemented by a lower level RDF library. 
 * The c14n code itself uses the low level abstract RDF JS datatypes only
 */
export interface GlobalState extends C14nState {
    data_factory  : rdf.DataFactory;
    quad_to_nquad : QuadToNquad; 
    logger        : Logger;
}

export interface NDegreeHashResult {
    hash: Hash;
    issuer: IdIssuer
}

export interface Logger {
    debug(message: string, ...otherData: any[]): void;
    warn(message: string, ...otherData: any[]): void;
    error(message: string, ...otherData: any[]): void;
    info(message: string, ...otherData: any[]): void;
}

export class NopLogger implements Logger {
    debug(message: string, ...otherData: any[]): void {};
    warn(message: string, ...otherData: any[]): void {};
    error(message: string, ...otherData: any[]): void {};
    info(message: string, ...otherData: any[]): void {};
}


/** Per spec, the BlankNode's "value" does not include the "_:", whereas it does in the C14 algorithm...  */
export function get_bnodeid(term: rdf.BlankNode): BNodeId {
    return `_:${term.value}`;
}

/**
 * Return the hash of a string.
 * 
 * @param data 
 * @returns hash value
 */
 export function compute_hash(data: string): Hash {
    return createHash(Constants.HASH_ALGORITHM).update(data).digest('hex');
}

/**
 * Return the hash of an array of nquad statements; per spec, this means
 * concatenating all nquads into a long array. Care should be taken that each
 * quad must end with a single `/n`.
 * 
 * @param nquads
 * @returns hash value
 * 
 */
export function hash_nquads(nquads: string[]): Hash {
    // It may be better to add to a hash the quads one by one and then make the calculation;
    // this is a possible optimization for another day...

    // Care should be taken that the final data to be hashed include a single `/n`
    // for every quad, before joining the quads into a string that must be hashed
    const data: string = nquads.map((q:string): string => q.endsWith('\n') ? q : `${q}\n`).join('');
    return compute_hash(data);
}

