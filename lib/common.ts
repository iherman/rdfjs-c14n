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
import { nquads }     from '@tpluscode/rdf-string';


export namespace Constants {
    /** The hashing algorithm's name used in the module */
    export const HASH_ALGORITHM = "sha256";

    /** The prefix used for all generated canonical bnode IDs */
    export const BNODE_PREFIX = "c14n";
}

       type Dataset     = rdf.DatasetCore<rdf.Quad,rdf.Quad>;
export type Quads       = Dataset | rdf.Quad[] | Set<rdf.Quad>;
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
 * The "algorithm" has been added to the state in anticipation of the evolution of the algorithm
 * that makes this (possibly) parametrized.
 */
export interface C14nState {
    bnode_to_quads   : BNodeToQuads;
    hash_to_bnodes   : HashToBNodes;
    canonical_issuer : IdIssuer;
    hash_algorithm   : string;
}

/**
 * These extensions to the state are not defined by the specification, but are necessary to
 * run.
 * These are the two functions/classes that must be implemented by a lower level RDF library. 
 * The c14n code itself uses the low level abstract RDF JS datatypes only
 */
export interface GlobalState extends C14nState {
    /** RDF data factory instance, to be used to create new terms and quads */
    data_factory    : rdf.DataFactory;

    /** RDF DatasetCoreFactory, to be used to create new datasets. If undefined, the return value of canonicalization is a set of quads. */
    dataset_factory ?: rdf.DatasetCoreFactory;

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
 * Return the hash of a string.
 * 
 * @param data 
 * @returns - hash value
 */
 export function compute_hash(state: C14nState, data: string): Hash {
    return createHash(state.hash_algorithm).update(data).digest('hex');
}

/**
 * Return the hash of an array of nquad statements; per spec, this means
 * concatenating all nquads into a long string. Care should be taken that each
 * quad must end with a single `/n`.
 * 
 * @param nquads
 * @returns - hash value
 * 
 */
export function hash_nquads(state: C14nState, nquads: string[]): Hash {
    // Care should be taken that the final data to be hashed include a single `/n`
    // for every quad, before joining the quads into a string that must be hashed
    const data: string = nquads.map((q:string): string => q.endsWith('\n') ? q : `${q}\n`).join('');
    return compute_hash(state, data);
}

/**
 * Return the hash of an array of nquad statements after being sorted. Per spec, this means
 * concatenating all nquads into a long string. Care should be taken that each
 * quad must end with a single `/n`.
 * 
 * @param nquads 
 * @returns 
 */
export function sort_and_hash_nquads(state: C14nState, nquads: string[]): Hash {
    nquads.sort();
    return hash_nquads(state, nquads)
}

/**
 * Hash a dataset
 * 
 * @param quads 
 * @param sort - whether the quads must be sorted before hash. Defaults to `true`.
 * @returns 
 */
export function hash_dataset(state: C14nState, quads: Iterable<rdf.Quad>, sort: boolean = true): Hash {
    const nquads: string[] = [];
    for(const quad of quads) {
        nquads.push(quad_to_nquad(quad))
    }
    if (sort) nquads.sort();
    return hash_nquads(state, nquads)
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

/**
 * A shell to provide a unified way of handling the various ways a graph can be represented: a full blown
 * rdf.DatasetCore, or an array or a Set of Quads.
 */
export class DatasetShell {
    private theGraph: Quads ;

    constructor(theGraph: Quads) {
        this.theGraph = theGraph;
    }

    add(quad: rdf.Quad) {
        if (Array.isArray(this.theGraph)) {
            this.theGraph.push(quad)
        } else {
            this.theGraph.add(quad);
        }
    }

    new(state: GlobalState): DatasetShell {
        if (Array.isArray(this.theGraph)) {
            return new DatasetShell([]);
        } else if(this.theGraph instanceof Set) {
            return new DatasetShell(new Set<rdf.Quad>());
        } else {
            if (state.dataset_factory) {
                return new DatasetShell(state.dataset_factory.dataset());    
            } else {
                return new DatasetShell(new Set<rdf.Quad>());
            }
        }
    }

    get data(): Quads {
        return this.theGraph;
    }

    /**
     * Iterate over the values in issuance order 
     */
     *[Symbol.iterator](): IterableIterator<rdf.Quad> {
        for (const quad of this.theGraph) {
            yield quad;
        }
    }
}
