import { createHash } from 'crypto';
import * as rdf       from 'rdf-js';
import { Constants, BNodeId, C14nState, Hash, RDF_Impl, NDegreeHashResult, HashToBNodes } from './types';

/**
 * Return the hash of a string.
 * 
 * @param data 
 * @returns 
 */
 export function compute_hash(data: string): string {
    return createHash(Constants.HASH_ALGORITHM).update(data).digest('hex');
}

/**
 * To simulate the notion of an ordered map of infra for Issued Identifier Map.
 * 
 * (This is not a generic implementation of an ordered map, just what is needed...)
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
     * Create a "deep" copy of this instance
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
     * Iterate over the values in issuance order
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
 * See https://www.w3.org/TR/rdf-canon/#issue-identifier-algorithm
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
     * Issue a new canonical identifier
     * 
     * See https://www.w3.org/TR/rdf-canon/#issue-identifier-algorithm
     * 
     * @param existing 
     * @returns 
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
     * Has the bnode already been canonicalized?
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
     * "Deep" copy of this instance
     */
    copy(): IdIssuer {
        const retval = new IdIssuer(this._prefix);
        retval._counter = this._counter;
        retval._issued_id_map = this._issued_id_map.copy();
        return retval;
    }
}


/**
 * Compute the first degree hashes
 * 
 * See https://www.w3.org/TR/rdf-canon/#hash-1d-quads-algorithm
 * 
 * @param state 
 * @param identifier 
 * @param rdf_impl 
 * @returns 
 */
export function compute_first_degree_hashes(identifier: BNodeId, state: C14nState, rdf_impl: RDF_Impl): Hash {
    // Step 1
    const nquads: string[] = [];
    // Step 2,3
    state.bnode_to_quads[identifier].forEach((quad: rdf.Quad): void => {
        // Get the 'fake' quad term to be used for hashing.
        const map_term = (t: rdf.Term): rdf.Term => {
            if (t.termType === "BlankNode") {
                const bid = `_:${t.value}`;
                return (bid === identifier) ? rdf_impl.data_factory.blankNode('a') : rdf_impl.data_factory.blankNode('z');
            } else {
                return t
            }
        }
        const new_term = rdf_impl.data_factory.quad(
            map_term(quad.subject) as rdf.Quad_Subject, 
            quad.predicate, 
            map_term(quad.object) as rdf.Quad_Object,
            map_term(quad.graph) as rdf.Quad_Graph
        );
        nquads.push(rdf_impl.quad_to_nquad(new_term))
    })
    // Step 4 (hopefully javascript does the right thing in terms of unicode)
    nquads.sort();
    // Step 5
    console.log(nquads);
    // Depending on the final version of the discussion on EOL, this should be finalized
    const final_to_be_hashed_eol: string = nquads.map((q:string): string => `${q}\n`).join('');
    const final_to_be_hashed_no_eol: string = nquads.join('');
    const final: string = (true) ? final_to_be_hashed_eol : final_to_be_hashed_no_eol;

    const the_hash: Hash = compute_hash(final);
    console.log(the_hash);

    return the_hash
}


/**
 * Hash Related Blank Node algorithm
 * 
 * See https://www.w3.org/TR/rdf-canon/#hash-related-algorithm
 * 
 * @param related 
 * @param quad 
 * @param state 
 * @param issuer 
 * @param position 
 * @param rdf_impl 
 * @returns 
 */
function hash_related_blank_node(related: BNodeId, quad: rdf.Quad, state: C14nState, issuer: IdIssuer, position: string, rdf_impl: RDF_Impl): Hash {

    // Step 1
    let identifier: BNodeId;
    if (state.canonical_issuer.is_set(related)) {
        identifier = state.canonical_issuer.issue_id(related);
    } else if (issuer.is_set(related)) {
        identifier = issuer.issue_id(related);
    } else {
        identifier = compute_first_degree_hashes(identifier, state, rdf_impl)
    }

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
 * @param canonicalization_state 
 * @param identifier 
 * @param identifier_issuer 
 * @returns 
 */

export function compute_n_degree_hashes(identifier: BNodeId, state: C14nState,  issuer: IdIssuer, rdf_impl: RDF_Impl): NDegreeHashResult {
    // Step 1
    const hash_to_bnodes: HashToBNodes = {};

    // Step 2, 3
    for (const quad of state.bnode_to_quads[identifier]) {
        // Step 3.1
        const per_component = (t: rdf.Term, position: string): void => {
            if (t.termType === "BlankNode" && `_:${t.value}` !== identifier) {
                // Step 3.1.1
                const hash = hash_related_blank_node(`_:${t.value}`, quad, state, issuer, position, rdf_impl);
                // Step 3.1.2
                if (hash_to_bnodes[hash] === undefined) {
                    hash_to_bnodes[hash] = [`_:${t.value}`];
                } else {
                    hash_to_bnodes[hash].push(`_:${t.value}`)
                }
            }
        }
        per_component(quad.subject,'s');
        per_component(quad.object, 'o');
        per_component(quad.graph,  'g');
    }



    return {
        hash: "",
        issuer: issuer
    };
}
