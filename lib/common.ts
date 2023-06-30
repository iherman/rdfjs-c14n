/**
 * Common types and minor utilities.
 * 
 * @copyright Ivan Herman 2023
 * 
 * @packageDocumentation
 */

import * as rdf       from 'rdf-js';
import * as n3        from 'n3';
import { createHash } from 'node:crypto';
import { env }        from 'node:process';
import * as fs        from 'node:fs';
import * as path      from 'node:path';

import * as config    from './config';

import { IDIssuer }   from './issueIdentifier';
import { nquads }     from '@tpluscode/rdf-string';
import { Logger }     from './logging';

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
 * According to the RDF semantics, the correct representation of a dataset is a Set
 * but, for convenience, many applications use arrays. Hence this type.
 */
export type Quads = rdf.Quad[] | Set<rdf.Quad>;

/*
 * Per spec, the input can be an abstract dataset (ie, Quads) or an N-Quads document (ie, a string)
 */
export type InputDataset = Quads | string;
export type BNodeId      = string;
export type Hash         = string;
export type QuadToNquad  = (quad: rdf.Quad) => string;

/**
 * BNode labels to Quads mapping. Used in the canonicalization state as the blank node to quad map. See
 * the [specification](https://www.w3.org/TR/rdf-canon/#canon-state).
 */
export interface BNodeToQuads {
    [index: BNodeId] : rdf.Quad[];
}

/**
 * Hash values to BNode labels mapping. Used in the canonicalization state as the hash to bnode map. See
 * the [specification](https://www.w3.org/TR/rdf-canon/#canon-state).
 */
export interface HashToBNodes {
    [index: Hash] : BNodeId[];
}

/**
 * Canonicalization result; ie, the result structure of the algorithm. 
 */
export interface C14nResult {
    /** N-Quads serialization of the dataset */
    canonical_form        : string;

    /** Dataset as Set or Array of rdf Quads */
    canonicalized_dataset : Quads;

    /** Mapping of a blank node to its identifier */
    bnode_identifier_map  : ReadonlyMap<rdf.BlankNode,BNodeId>;

    /** Mapping of an (original) blank node id to its canonical equivalent */
    issued_identifier_map : ReadonlyMap<BNodeId,BNodeId>;
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
    dataFactory     : rdf.DataFactory;

    /** A logger instance */
    logger          : Logger;

    /** Logger instance's identifier name */
    logger_id       : string;

    /**
     * Complexity number: the multiplicative factor that
     * sets the value of {@link maximum_n_degree_call} by
     * multiplying it with the number of blank nodes
     */
    complexity_number : number;

    /** 
     * Maximal number of recursions allowed. 
     * This value may be modified by the caller
     */
    maximum_n_degree_call : number;
    
    /**
     * Current recursion level. Initialized to zero, increased every time a recursion occurs
     */
    current_n_degree_call : number;
}

/**
 * Return structure from a N-degree quad's hash computation, see [the specification](https://www.w3.org/TR/rdf-canon/#hash-nd-quads-algorithm).
 */
export interface NDegreeHashResult {
    hash   : Hash;
    issuer : IDIssuer
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
 * Return a single N-Quads document out of an array of nquad statements. Per specification, 
 * this means concatenating all nquads into a long string. Care should be taken that each
 * quad must end with a single `/n`.
 * 
 * @param nquads
 * @returns - hash value
 * 
 */
export function concatNquads(nquads: string[]): string {
    return nquads.map((q:string): string => q.endsWith('\n') ? q : `${q}\n`).join('');
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
 * Parse an nQuads document into a set of Quads
 * 
 * @param nquads 
 * @returns parsed dataset
 */
export function parseNquads(nquads: string): Quads {
    const parser = new n3.Parser({blankNodePrefix: ''});
    const quads: rdf.Quad[] = parser.parse(nquads);
    return new Set<rdf.Quad>(quads);
}

/**
 * A shell to provide a unified way of handling the various ways a graph can be represented: a full blown
 * [RDF Dataset core instance](https://rdf.js.org/dataset-spec/#datasetcore-interface), an Array of Quads, or a Set of Quads.
 * 
 * @remarks
 * The reason this class is necessary is (1) the Array object in JS does not have a `add` 
 * property and (2) care should be taken about creating new RDF Datasets to reproduce the same 
 * "option" for Quads (see the {@link new} method).
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
     * @param state 
     * @returns - a new (empty) dataset
     */
    new(): DatasetShell {
        if (Array.isArray(this.the_dataset)) {
            return new DatasetShell([]);
        } else {
            return new DatasetShell(new Set<rdf.Quad>());
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


/**
 * Handling the configuration data that the user can use, namely:
 * 
 * - `$HOME/.rdfjs_c14n.json` following {@link config.ConfigData}
 * - `$PWD/.rdfjs_c14n.json` following {@link config.ConfigData}
 * - Environment variables `c14_complexity` and/or `c14n_hash`
 * 
 * (in increasing priority order).
 * 
 * If no configuration is set, and/or the values are invalid, the default values are used.
 * 
 * @returns 
 */
export function configData(): config.ConfigData {
    // Read the configuration file; the env_name gives the base for the file name
    // It is a very small file, sync file read is used to make it simple...
    const get_config = (env_name: string): config.ConfigData => {
        if (env_name in env) {
            const fname = path.join(`${env[env_name]}`,".rdfjs_c14n.json");
            try {
                return JSON.parse(fs.readFileSync(fname,'utf-8')) as config.ConfigData;
            } catch(e) {
                return {};
            }
        } else {
            return {};
        }
    };
    // Create a configuration data for the environment variables (if any)
    const get_env_data = () : config.ConfigData => {
        const retval: config.ConfigData = {};
        if (config.ENV_COMPLEXITY in env) retval.c14n_complexity = Number(env[config.ENV_COMPLEXITY]);
        if (config.ENV_HASH_ALGORITHM in env) retval.c14n_hash = env[config.ENV_HASH_ALGORITHM];
        return retval;
    };

    const home_data: config.ConfigData  = get_config("HOME");
    const local_data: config.ConfigData = get_config("PWD");
    const env_data: config.ConfigData   = get_env_data();
    const sys_data: config.ConfigData   = {
        c14n_complexity : config.DEFAULT_MAXIMUM_COMPLEXITY,
        c14n_hash       : config.HASH_ALGORITHM,
    }
    let retval: config.ConfigData = {};

    // "Merge" all the configuration data in the right priority order
    Object.assign(retval, sys_data, home_data, local_data, env_data)

    // Sanity check of the data:
    if (Number.isNaN(retval.c14n_complexity) || retval.c14n_complexity <= 0) {
        retval.c14n_complexity = config.DEFAULT_MAXIMUM_COMPLEXITY;
    }
    if (!config.HASH_ALGORITHMS.includes(retval.c14n_hash)) {
        retval.c14n_hash = config.HASH_ALGORITHM;
    }

    return retval;
}
