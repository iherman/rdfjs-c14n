/**
 * Common types and minor utilities.
 * 
 * @copyright Ivan Herman 2023
 * 
 * @packageDocumentation
 */

import * as rdf       from 'rdf-js';
import { createHash } from 'crypto';
import { IdIssuer }   from './issue_identifier';
import {nquads}       from '@tpluscode/rdf-string';


export namespace Constants {
    /** The hashing algorithm's name used in the module */
    export const HASH_ALGORITHM = "sha256";

    /** The prefix used for all generated canonical bnode IDs */
    export const BNODE_PREFIX = "_:c14n";
}

export type Dataset     = rdf.DatasetCore<rdf.Quad,rdf.Quad>;
export type BNodeId     = string;
export type Hash        = string;
export type QuadToNquad = (quad: rdf.Quad) => string;

/**
 * Used in the canonicalization state: blank node to quad map. See
 * the [specification](https://w3c.github.io/rdf-canon/spec/#canon-state).
 */
export interface BNodeToQuads {
    [index: BNodeId] : rdf.Quad[];
}

/**
 * Used in the canonicalization state: hash to bnode map. See
 * the [specification](https://w3c.github.io/rdf-canon/spec/#canon-state).
 */
export interface HashToBNodes {
    [index: Hash] : BNodeId[];
}

/**
 * Canonicalization state. See
 * the [specification](https://w3c.github.io/rdf-canon/spec/#canon-state).
 */
export interface C14nState {
    bnode_to_quads   : BNodeToQuads;
    hash_to_bnodes   : HashToBNodes;
    canonical_issuer : IdIssuer;
}

/**
 * These extensions to the state are not defined by the specification, but are necessary to
 * run.
 * These are the two functions/classes that must be implemented by a lower level RDF library. 
 * The c14n code itself uses the low level abstract RDF JS datatypes only
 */
export interface GlobalState extends C14nState {
    /** RDF data factory instance, to be used to create new bnodes and quads */
    data_factory    : rdf.DataFactory;

    /** RDF DatasetCoreFactory, to be used to create new datasets */
    dataset_factory : rdf.DatasetCoreFactory;

    /** A logger instance */
    logger          : Logger;
}

/**
 * Return structure from a N-degree quad's hash computation, see [the specification](https://www.w3.org/TR/rdf-canon/#hash-nd-quads-algorithm).
 */
export interface NDegreeHashResult {
    hash: Hash;
    issuer: IdIssuer
}

/**
 * Very simple Logger interface, to be used in the code. Nothing fancy.
 */
export interface Logger {
    debug(message: string, ...otherData: any[]): void;
    warn(message: string, ...otherData: any[]): void;
    error(message: string, ...otherData: any[]): void;
    info(message: string, ...otherData: any[]): void;
}

/**
 * A default, no-operation logger instance, used by default.
 */
export class NopLogger implements Logger {
    debug(message: string, ...otherData: any[]): void {};
    warn(message: string, ...otherData: any[]): void {};
    error(message: string, ...otherData: any[]): void {};
    info(message: string, ...otherData: any[]): void {};
}


/** 
 * Per RDF Interface specification, the BlankNode's "value" does not include the "_:",
 * whereas the C14 algorithm does. This function returns the value of a blank node's ID
 * preceded by the `_:`
 * 
 * @param term
 * @returns
 */
export function get_bnodeid(term: rdf.BlankNode): BNodeId {
    return `_:${term.value}`;
}

/**
 * Return the hash of a string.
 * 
 * @param data 
 * @returns - hash value
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
 * @returns - hash value
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

/**
 * Return an nquad version for a single quad.
 * 
 * @param quad 
 * @returns 
 */
export function quad_to_nquad(quad: rdf.Quad): string {
    const retval = nquads`${quad}`.toString();
    return retval.endsWith('  .') ? retval.replace(/  .$/, ' .') : retval;
}
