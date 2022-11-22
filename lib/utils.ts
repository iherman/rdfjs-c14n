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
 * Issue Identifier
 */
export class IdIssuer {
    private _prefix: string;
    private _counter: number;
    private _issued_id_list: IdListItem[];

    constructor() {
        this._prefix         = Constants.BNODE_PREFIX;
        this._counter        = 0;
        this._issued_id_list = [];
    }

    /**
     * Issue a new canonical identifier
     * 
     * @param existing 
     * @returns 
     */
    issue_id(existing: BNodeId): BNodeId {
        const list_item = this._issued_id_list.find((item: IdListItem): boolean => item.existing === existing)
        if (list_item !== undefined) {
            return list_item.issued
        } else {
            const issued: BNodeId = `${this._prefix}${this._counter}`;
            this._issued_id_list.push({existing, issued});
            this._counter++;
            return issued;
        }
    }

    /**
     * Map the identifier to its canonical equivalent
     * 
     * @param existing 
     * @returns 
     */
    map_to_canonical(existing: BNodeId): BNodeId {
        const item: IdListItem = this._issued_id_list.find((value: IdListItem): boolean => value.existing === existing)
        return (item) ? item.issued : existing;
    }

    /**
     * Return the list of existing/canonical identity pairs
     */
    get issued_id_list() : IdListItem[] {
        return this._issued_id_list;
    }
}
