import * as rdf     from 'rdf-js';
import { IdIssuer } from './utils';
import { quad_to_nquad } from '../Attic/rdfjs';

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
}


export interface NDegreeHashResult {
    hash: Hash;
    issuer: IdIssuer
}
