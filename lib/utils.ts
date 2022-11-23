import { createHash }         from 'crypto';
import { Constants, BNodeId } from './types';

/**
 * Return the hash of a string.
 * 
 * @param data 
 * @returns 
 */
 export function hash(data: string): string {
    return createHash(Constants.HASH_ALGORITHM).update(data).digest('hex');
}


interface IdListItem {
    existing : BNodeId;
    issued   : BNodeId;
}

/**
 * To simulate the notion of an ordered map of infra for Issued Identifier Map.
 * 
 * (This is not a generic implementation of an ordered map, just what is needed...)
 */
class IssuedIdMap {
    private _keys: string[];
    private _values: { [index: BNodeId]: BNodeId };
    constructor() {
        this._keys = [];
        this._values = {};
    }

    add(key: BNodeId, value:BNodeId) {
        if (this._keys.indexOf(key) === -1) {
            this._keys.push(key);
        }
        this._values[key] = value;
    }

    retrieve(key: BNodeId): BNodeId|undefined {
        if (this._keys.indexOf(key) === -1) {
            return undefined;
        } else {
            return this._values[key];
        }
    }

    *[Symbol.iterator](): IterableIterator<BNodeId> {
        for (const key of this._keys) {
            yield this._values[key]
        }
    }
}


/**
 * Issue Identifier
 */
export class IdIssuer {
    private _prefix: string;
    private _counter: number;
    private _issued_id_map: IssuedIdMap;

    constructor() {
        this._prefix         = Constants.BNODE_PREFIX;
        this._counter        = 0;
        this._issued_id_map  = new IssuedIdMap();
    }

    /**
     * Issue a new canonical identifier
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
     * Map an identifier to its canonical equivalent
     * 
     * @param existing 
     * @returns 
     */
    map_to_canonical(existing: BNodeId): BNodeId {
        const issued = this._issued_id_map.retrieve(existing);
        return (issued) ? issued : existing;
    }
}
