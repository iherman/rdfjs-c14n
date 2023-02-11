/**
 * Common types and minor utilities.
 * 
 * @copyright Ivan Herman 2023
 * 
 * @packageDocumentation
 */

import * as rdf       from 'rdf-js';
import { createHash } from 'crypto';
import { IDIssuer }   from './issueIdentifier';
import { nquads }     from '@tpluscode/rdf-string';
import { Logger }     from './logging';

export namespace Constants {
    /** 
     * The hashing algorithm's name used in the module
     */
    export const HASH_ALGORITHM = "sha256";

    /** 
     * The prefix used for all generated canonical bnode IDs 
     * 
     * @readonly
     */
    export const BNODE_PREFIX = "c14n";
}

export type Quads       = rdf.DatasetCore<rdf.Quad,rdf.Quad> | rdf.Quad[] | Set<rdf.Quad>;
export type BNodeId     = string;
export type Hash        = string;
export type QuadToNquad = (quad: rdf.Quad) => string;

/**
 * BNode labels to Quads mapping. Used in the canonicalization state: blank node to quad map. See
 * the [specification](https://www.w3.org/TR/rdf-canon/#canon-state).
 */
export interface BNodeToQuads {
    [index: BNodeId] : rdf.Quad[];
}

/**
 * Hash values to BNode labels mapping. Used in the canonicalization state: hash to bnode map. See
 * the [specification](https://www.w3.org/TR/rdf-canon/#canon-state).
 */
export interface HashToBNodes {
    [index: Hash] : BNodeId[];
}

/**
 * Canonicalization state. See
 * the [specification](https://www.w3.org/TR/rdf-canon/#canon-state).
 * 
 * The "hash algorithm" field has been added to the state in anticipation of the evolution of the algorithm
 * that may make this parametrized.
 */
export interface C14nState {
    bnode_to_quads   : BNodeToQuads;
    hash_to_bnodes   : HashToBNodes;
    canonical_issuer : IDIssuer;
    hash_algorithm   : string;
}

/**
 * Extensions to the state. These extensions are not defined by the specification, but are necessary to
 * run.
 * 
 * @remarks
 * The class instances in this extension are necessary to create/modify RDF terms, or to provide logging. These instances
 * reflect the underlying RDF environment that uses this module; the algorithm itself depends on standard RDF interfaces only.
 */
export interface GlobalState extends C14nState {
    /** 
     * [RDF data factory instance](http://rdf.js.org/data-model-spec/#datafactory-interface), to be used to create new terms and quads 
     */
    dataFactory     : rdf.DataFactory;

    /** 
     * [RDF Dataset core factory instance](https://rdf.js.org/dataset-spec/#datasetcorefactory-interface), to be used to create new datasets.
     * If undefined, the return value of canonicalization is a Set of quads. 
     */
    datasetFactory ?: rdf.DatasetCoreFactory;

    /** A logger instance */
    logger          : Logger;
}

/**
 * Return structure from a N-degree quad's hash computation, see [the specification](https://www.w3.org/TR/rdf-canon/#hash-nd-quads-algorithm).
 */
export interface NDegreeHashResult {
    hash: Hash;
    issuer: IDIssuer
}


/***********************************************************
Various utility functions used by the rest of the code.  
***********************************************************/

/**
 * Return the hash of a string.
 * 
 * @param data 
 * @returns - hash value
 */
 export function computeHash(state: C14nState, data: string): Hash {
    return createHash(state.hash_algorithm).update(data).digest('hex');
}

/**
 * Return the hash of an array of nquad statements; per specification, this means
 * concatenating all nquads into a long string. Care should be taken that each
 * quad must end with a single `/n`.
 * 
 * @param nquads
 * @returns - hash value
 * 
 */
export function hashNquads(state: C14nState, nquads: string[]): Hash {
    // Care should be taken that the final data to be hashed include a single `/n`
    // for every quad, before joining the quads into a string that must be hashed
    const data: string = nquads.map((q:string): string => q.endsWith('\n') ? q : `${q}\n`).join('');
    return computeHash(state, data);
}

/**
 * Return the hash of an array of nquad statements after being sorted. Per spec, this means
 * concatenating all nquads into a long string. Care should be taken that each
 * quad must end with a single `/n`.
 * 
 * @param nquads 
 * @returns - hash value
 */
export function sortAndHashNquads(state: C14nState, nquads: string[]): Hash {
    nquads.sort();
    return hashNquads(state, nquads)
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
export function quadsToNquads(quads: Iterable<rdf.Quad>, sort:boolean = true): string[] {
    const retval: string[] = [];
    for(const quad of quads) {
        retval.push(quadToNquad(quad))
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
 */
export function hashDataset(state: C14nState, quads: Iterable<rdf.Quad>, sort: boolean = true): Hash {
    const nquads: string[] = quadsToNquads(quads, sort)
    return hashNquads(state, nquads)
}

/**
 * A shell to provide a unified way of handling the various ways a graph can be represented: a full blown
 * [RDF Dataset core instance](https://rdf.js.org/dataset-spec/#datasetcore-interface), an Array of Quads, or a Set of Quads.
 * 
 * @remarks
 * The reason this is necessary is (1) the Array object in JS does not have a `add` property and (2) care should be taken about creating new RDF Datasets, see the {@link new} method.
 */
export class DatasetShell {
    private the_dataset: Quads ;

    constructor(dataset: Quads) {
        this.the_dataset = dataset;
    }

    add(quad: rdf.Quad) {
        if (Array.isArray(this.the_dataset)) {
            this.the_dataset.push(quad)
        } else {
            this.the_dataset.add(quad);
        }
    }

    /**
     * Create a new instance whose exact type reflects the current type. 
     * 
     * @remarks
     * If the global state days not provide a [RDF Dataset core factory instance](https://rdf.js.org/dataset-spec/#datasetcorefactory-interface),
     * a Set of Quads will be used instead.
     * 
     * @param state 
     * @returns - a new (empty) dataset
     */
    new(state: GlobalState): DatasetShell {
        if (Array.isArray(this.the_dataset)) {
            return new DatasetShell([]);
        } else if(this.the_dataset instanceof Set) {
            return new DatasetShell(new Set<rdf.Quad>());
        } else {
            if (state.datasetFactory) {
                return new DatasetShell(state.datasetFactory.dataset());    
            } else {
                return new DatasetShell(new Set<rdf.Quad>());
            }
        }
    }

    get dataset(): Quads {
        return this.the_dataset;
    }

    /**
     * Iterate over the quads 
     */
     *[Symbol.iterator](): IterableIterator<rdf.Quad> {
        for (const quad of this.the_dataset) {
            yield quad;
        }
    }
}
