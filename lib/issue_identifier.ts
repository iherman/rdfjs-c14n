/**
 * Issue Identifier
 * 
 * @copyright Ivan Herman 2023
 * 
 * @packageDocumentation
 */

import { Constants, BNodeId } from './common';


/**
 * Issue Identifier.
 * 
 * See [the specification](https://www.w3.org/TR/rdf-canon/#issue-identifier-algorithm) for the details, except that all
 * functionalities are encapsulated in one class.
 */
export class IdIssuer {
    private _prefix        : string;
    private _counter       : number;
    private _issued_id_map : Map<BNodeId,BNodeId>;

    /**
     * 
     * @param prefix - the prefix used for the generated IDs
     */
    constructor(prefix: string = Constants.BNODE_PREFIX) {
        this._prefix         = prefix;
        this._counter        = 0;
        this._issued_id_map  = new Map();
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
        const issued = this._issued_id_map.get(existing);
        if (issued !== undefined) {
            return issued
        } else {
            const newly_issued: BNodeId = `${this._prefix}${this._counter}`;
            this._issued_id_map.set(existing,newly_issued)
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
        return this._issued_id_map.get(existing) !== undefined;
    }

    /**
     * "Deep" copy of this instance
     */
    copy(): IdIssuer {
        const retval          = new IdIssuer(this._prefix);
        retval._counter       = this._counter;
        retval._issued_id_map = new Map(this._issued_id_map);
        return retval;
    }

    /**
     * Iterate over the values in issuance order 
     */
     *[Symbol.iterator](): IterableIterator<[BNodeId,BNodeId]> {
        for (const [key,value] of this._issued_id_map) {
            yield [key,value]
        }
    }
}
