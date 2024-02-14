/**
 * Issue Identifier class.
 * 
 * @copyright Ivan Herman 2023
 * 
 * @packageDocumentation
 */

import { BNODE_PREFIX, BNodeId } from './common';
import { LogItem } from './logging';

/**
 * Issue Identifier.
 * 
 * See [the specification](https://www.w3.org/TR/rdf-canon/#issue-identifier-algorithm) for the details, except that all
 * functionalities are encapsulated in a class.
 */
export class IDIssuer {
    // This is used to provide a readable ID at debug/logging time...
    private static _IDIssuerID: number = 1234;
    // ... for each instance; it is only used for debugging purposes.
    private _id: number;

    // See [the specification](https://www.w3.org/TR/rdf-canon/#issue-identifier-algorithm)
    private _identifier_prefix: string;
    private _identifier_counter: number;
    private _issued_identifiers_map: Map<BNodeId, BNodeId>;

    /**
     * 
     * @param prefix - the prefix used for the generated IDs.
     */
    constructor(prefix: string = BNODE_PREFIX) {
        this._id = IDIssuer._IDIssuerID++;
        this._identifier_prefix = prefix;
        this._identifier_counter = 0;
        this._issued_identifiers_map = new Map();
    }

    /**
     * Accessor to the issued identifier map, to be returned as part of the return
     * structure for the main algorithm.
     */
    get issued_identifier_map(): Map<BNodeId, BNodeId> {
        return this._issued_identifiers_map;
    }

    /**
     * Issue a new canonical identifier.
     * 
     * See [the specification](https://www.w3.org/TR/rdf-canon/#issue-identifier-algorithm).
     * 
     * @param existing the original bnode id
     * @returns the canonical equivalent (which may have been newly minted in the process)
     */
    issueID(existing: BNodeId): BNodeId {
        const issued = this._issued_identifiers_map.get(existing);
        if (issued !== undefined) {
            return issued;
        } else {
            const newly_issued: BNodeId = `${this._identifier_prefix}${this._identifier_counter}`;
            this._issued_identifiers_map.set(existing, newly_issued);
            this._identifier_counter++;
            return newly_issued;
        }
    }

    /**
     * Mapping from a blank node to its canonical equivalent; 
     * this method is necessary to use this instance as part
     * of the return structure for the canonicalizer function.
     */
    map(id: BNodeId): BNodeId {
        if (this.isSet(id)) {
            return this._issued_identifiers_map.get(id);
        } else {
            return undefined;
        }
    }

    /**
     * Has a bnode label been assigned a canonical alternative?
     * 
     * @param existing - the bnode id to be checked
     */
    isSet(existing: BNodeId): boolean {
        return this._issued_identifiers_map.get(existing) !== undefined;
    }

    /**
     * "Deep" copy of this instance.
     */
    copy(): IDIssuer {
        const retval = new IDIssuer(this._identifier_prefix);
        retval._identifier_counter = this._identifier_counter;
        retval._issued_identifiers_map = new Map(this._issued_identifiers_map);
        return retval;
    }

    /**
     * Iterate over the values in issuance order.
     */
    *[Symbol.iterator](): IterableIterator<[BNodeId, BNodeId]> {
        for (const [key, value] of this._issued_identifiers_map) {
            yield [key, value];
        }
    }

    /**
     * Presentation for logging.
     */
    toLogItem(): LogItem {
        const retval: LogItem = {
            "issuer ID": `${this._id}`,
            "prefix": this._identifier_prefix,
            "counter": `${this._identifier_counter}`,
            "mappings": this._issued_identifiers_map
        };
        return retval;
    }
}
