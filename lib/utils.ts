import { createHash } from 'crypto';
import * as rdf       from 'rdf-js';
import { Constants, BNodeId, Hash, NDegreeHashResult, HashToBNodes, GlobalState } from './types';

const permutation = require('array-permutation');

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


/**
 * To simulate the notion of an ordered map of infra for Issued Identifier Map.
 * 
 * (This is _not_ a generic implementation of an ordered map, just what is needed...)
 */
class IssuedIdMap {
    private _keys   : BNodeId[];
    private _values : { [index: BNodeId]: BNodeId };
    constructor() {
        this._keys = [];
        this._values = {};
    }

    /**
     * Add a new key value pair, and keep the order of the key
     * @param key 
     * @param value 
     */
    add(key: BNodeId, value: BNodeId) {
        if (this._keys.indexOf(key) === -1) {
            this._keys.push(key);
        }
        this._values[key] = value;
    }

    /**
     * Retrieve the value associated with key
     * 
     * @param key 
     * @returns 
     */
    retrieve(key: BNodeId): BNodeId|undefined {
        if (this._keys.indexOf(key) === -1) {
            return undefined;
        } else {
            return this._values[key];
        }
    }

    /**
     * Check is a value has been set for key
     * 
     * @param key 
     * @returns 
     */
    is_set(key: BNodeId): boolean {
        return this._keys.indexOf(key) !== -1;
    }

    /**
     * Access the set of key in issuance order
     */
    get keys(): BNodeId[] {
        return this._keys
    }

    /**
     * Create a "deep" copy of this instance (needed in the case of a complex graph)
     * 
     * @returns 
     */
    copy(): IssuedIdMap {
        const retval = new IssuedIdMap();
        for (const key of this.keys) {
            retval.add(key, this._values[key])
        }

        return retval;
    }

    /**
     * Iterate over the values in issuance order (not sure this is used, in fact...)
     */
    *[Symbol.iterator](): IterableIterator<BNodeId> {
        for (const key of this._keys) {
            yield this._values[key]
        }
    }
}


/**
 * Issue Identifier
 * 
 * See https://www.w3.org/TR/rdf-canon/#issue-identifier-algorithm, except that all
 * functionalities are encapsulated in one class
 */
export class IdIssuer {
    private _prefix        : string;
    private _counter       : number;
    private _issued_id_map : IssuedIdMap;

    constructor(prefix: string = Constants.BNODE_PREFIX) {
        this._prefix         = prefix;
        this._counter        = 0;
        this._issued_id_map  = new IssuedIdMap();
    }

    /**
     * Issue a new canonical identifier.
     * 
     * See https://www.w3.org/TR/rdf-canon/#issue-identifier-algorithm
     * 
     * @param existing the original bnode id
     * @returns the canonical equivalent
     */
    issue_id(existing: BNodeId): BNodeId {
        const issued = this._issued_id_map.retrieve(existing);
        if (issued !== undefined) {
            return issued
        } else {
            const newly_issued: BNodeId = `${this._prefix}${this._counter}`;
            this._issued_id_map.add(existing,newly_issued)
            this._counter++;
            return newly_issued;
        }
    }

    /**
     * Has a bnode already been canonicalized?
     * 
     * @param existing the bnode id to be checked
     */
    is_set(existing: BNodeId): boolean {
        return this._issued_id_map.is_set(existing)
    }

    /**
     * List, in order of issuance, all the BNodes that have been issued a new ID
     */
    existing_identifiers(): BNodeId[] {
        return this._issued_id_map.keys;
    }

    /**
     * "Deep" copy of this instance (needed in the case of a complex graph)
     */
    copy(): IdIssuer {
        const retval = new IdIssuer(this._prefix);
        retval._counter = this._counter;
        retval._issued_id_map = this._issued_id_map.copy();
        return retval;
    }
}


/**
 * Compute the first degree hash: a simple hash based on the immediate "surrounding" of a blank node, ie, quads that the
 * blank node is part of. Ideally, the result uniquely characterizes the blank node (but not always...).
 * 
 * See [algorithm details in](https://www.w3.org/TR/rdf-canon/#hash-1d-quads-algorithm), and
 * the separate [overview](https://w3c.github.io/rdf-canon/spec/#hash-1d-quads-overview)
 * 
 * @param state 
 * @param identifier 
 * @returns 
 */
export function compute_first_degree_hashes(identifier: BNodeId, state: GlobalState): Hash {
    // Step 1
    const nquads: string[] = [];
    // Step 2,3: Collect all quads that includes the blank node that we are talking about.
    // For each of those quads create a "fake" one just differentiating between this blank node and
    // a possible other.
    // The collected quads must be sorted and hashed, providing a (hopefully unique) hash that
    // characterizes the bnode.
    state.bnode_to_quads[identifier].forEach((quad: rdf.Quad): void => {
        // Get the 'fake' quad term to be used for hashing.
        const map_term = (t: rdf.Term): rdf.Term => {
            if (t.termType === "BlankNode") {
                const bid = get_bnodeid(t);
                return (bid === identifier) ? state.data_factory.blankNode('a') : state.data_factory.blankNode('z');
            } else {
                return t
            }
        }
        const new_term = state.data_factory.quad(
            map_term(quad.subject) as rdf.Quad_Subject, 
            quad.predicate, 
            map_term(quad.object) as rdf.Quad_Object,
            map_term(quad.graph) as rdf.Quad_Graph
        );
        nquads.push(state.quad_to_nquad(new_term))
    })
    // Step 4 (hopefully javascript does the right thing in terms of unicode)
    nquads.sort();
    // Step 5
    state.logger.info(`${nquads}`);
    const the_hash: Hash = hash_nquads(nquads)
    state.logger.info(the_hash);
    return the_hash;
}


/**
 * Hash Related Blank Node algorithm. Returns a unique hash value for a bnode that is in the same quad as the one
 * considered in the main loop. The value of 'position' is used to differentiate the situation when the
 * bnode here is in a subject, object, or graph position.
 * 
 * See https://www.w3.org/TR/rdf-canon/#hash-related-algorithm
 * 
 * @param related 
 * @param quad 
 * @param state 
 * @param issuer 
 * @param position 
 * @returns 
 */
function compute_hash_related_blank_node(related: BNodeId, quad: rdf.Quad, state: GlobalState, issuer: IdIssuer, position: string): Hash {
    const get_identifier = (): BNodeId => {
        if (state.canonical_issuer.is_set(related)) {
            return state.canonical_issuer.issue_id(related);
        } else if (issuer.is_set(related)) {
            return issuer.issue_id(related);
        } else {
            return compute_first_degree_hashes(identifier, state)
        }    
    };

    // Step 1
    const identifier: BNodeId = get_identifier();

    // Step 2
    let input: string = position;

    // Step 3
    if (position !== 'g') {
        input = `${input}<${quad.predicate.value}>`
    }

    // Step 4
    input = `${input}${identifier}`;

    // Step 5
    return compute_hash(input);
}


/**
 * Compute the n-degree hashes
 * 
 * See https://www.w3.org/TR/rdf-canon/#hash-nd-quads-algorithm
 * 
 * @param state 
 * @param identifier 
 * @param issuer 
 * @returns 
 */

export function compute_n_degree_hashes(identifier: BNodeId, state: GlobalState,  issuer: IdIssuer): NDegreeHashResult {
    // Step 1
    const hash_to_bnodes: HashToBNodes = {};

    // Step 2, 3
    // Calculate a unique hash for all other bnodes that are immediately connected to 'identifier'
    for (const quad of state.bnode_to_quads[identifier]) {
        // Step 3.1
        const per_component = (t: rdf.Term, position: string): void => {
            if (t.termType === "BlankNode" &&  get_bnodeid(t) !== identifier) {
                // Step 3.1.1
                const hash = compute_hash_related_blank_node(get_bnodeid(t), quad, state, issuer, position);
                // Step 3.1.2
                if (hash_to_bnodes[hash] === undefined) {
                    hash_to_bnodes[hash] = [get_bnodeid(t)];
                } else {
                    hash_to_bnodes[hash].push(get_bnodeid(t))
                }
            }
        }
        per_component(quad.subject,'s');
        per_component(quad.object, 'o');
        per_component(quad.graph,  'g');
    }

    // Step 4
    let data_to_hash: string = '';

    // Step 5
    const hashes: Hash[] = Object.keys(hash_to_bnodes).sort();
    for (const hash of hashes) {
        // Step 5.1
        data_to_hash = `${data_to_hash}${hash}`;

        // Step 5.2
        let chosen_path: string = '';

        // Step 5.3
        let chosen_issuer: IdIssuer;

        // Step 5.4
        perms: for (const perm of permutation(hash_to_bnodes[hash])) {
            // Step 5.4.1
            let issuer_copy: IdIssuer = issuer.copy();

            // Step 5.4.2
            let path: string;

            // Step 5.4.3
            const recursion_list: BNodeId[] = [];

            // Step 5.4.4
            for (const related of perm) {
                if (state.canonical_issuer.is_set(related)) {
                    // Step 5.4.4.1
                    path = `${path}${state.canonical_issuer.issue_id(related)}`;
                } else {
                    // Step 5.4.4.2
                    if (!issuer_copy.is_set(related)) {
                        recursion_list.push(related);
                    }
                    path = `${path}${issuer_copy.issue_id(related)}`;
                }
                // Step 5.4.4.3
                if (chosen_path.length > 0 && path.length >= chosen_path.length &&  path > chosen_path) {
                    continue perms;
                }
            }

            // Step 5.4.5
            for (const related of recursion_list) {
                // Step 5.4.5.1
                const result: NDegreeHashResult = compute_n_degree_hashes(related, state, issuer_copy);

                // Step 5.4.5.2
                path = `${path}${issuer_copy.issue_id(related)}`;

                // Step 5.4.5.3
                path = `${path}<${result.hash}>`;

                // Step 5.4.5.4
                issuer_copy = result.issuer;

                // Step 5.4.5.5
                if (chosen_path.length > 0 && path.length >= chosen_path.length && path > chosen_path) {
                    continue perms;
                }
            }

            // Step 5.4.6
            if (chosen_path.length === 0 || path < chosen_path) {
                chosen_path   = path;
                chosen_issuer = issuer_copy;
            }
        }

        // Step 5.5.
        data_to_hash = `${data_to_hash}${chosen_path}`;

        // Step 5.6
        issuer = chosen_issuer;
    }

    return {
        hash: compute_hash(data_to_hash),
        issuer: issuer
    };
}
