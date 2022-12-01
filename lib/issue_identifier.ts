/**
 * Issue Identifier
 * 
 * @copyright Ivan Herman 2023
 * 
 * @packageDocumentation
 */

import { Constants, BNodeId } from './common';

/**
 * To simulate the notion of an ordered map of infra for Issued Identifier Map.
 * 
 * (This is _not_ a generic implementation of an ordered map, just what is needed...)
 */
 class IssuedIdMap {
    private _keys   : BNodeId[];
    private _values : { [index: BNodeId]: BNodeId };

    /**
     * @constructor
     */
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
 * Issue Identifier.
 * 
 * See [the specification](https://www.w3.org/TR/rdf-canon/#issue-identifier-algorithm) for the details, except that all
 * functionalities are encapsulated in one class.
 */
export class IdIssuer {
    private _prefix        : string;
    private _counter       : number;
    private _issued_id_map : IssuedIdMap;

    /**
     * 
     * @param prefix - the prefix used for the generated IDs
     */
    constructor(prefix: string = Constants.BNODE_PREFIX) {
        this._prefix         = prefix;
        this._counter        = 0;
        this._issued_id_map  = new IssuedIdMap();
    }

    /**
     * Issue a new canonical identifier.
     * 
     * See [the specification](https://www.w3.org/TR/rdf-canon/#issue-identifier-algorithm).
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
     * @param existing - the bnode id to be checked
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
