/**
 * Issue Identifier
 * 
 * @copyright Ivan Herman 2023
 * 
 * @packageDocumentation
 */

import { Constants, BNodeId } from './common';
import { LogItem }            from './logging';

/**
 * Issue Identifier.
 * 
 * See [the specification](https://www.w3.org/TR/rdf-canon/#issue-identifier-algorithm) for the details, except that all
 * functionalities are encapsulated in a class.
 */
export class IDIssuer {
    // This is mainly used to provide a readable ID at debug/logging time...
    private static IDIssuerID : number = 1234;
    // ... for each instance; it is only used for debugging purposes.
    private id                : number;

    // See [the specification](https://www.w3.org/TR/rdf-canon/#issue-identifier-algorithm)
    private identifier_prefix      : string;
    private identifier_counter     : number;
    private issued_identifiers_map : Map<BNodeId,BNodeId>;

    /**
     * 
     * @param prefix - the prefix used for the generated IDs
     */
    constructor(prefix: string = Constants.BNODE_PREFIX) {
        this.id                     = IDIssuer.IDIssuerID++;
        this.identifier_prefix      = prefix;
        this.identifier_counter     = 0;
        this.issued_identifiers_map = new Map();
    }

    /**
     * Issue a new canonical identifier.
     * 
     * See [the specification](https://www.w3.org/TR/rdf-canon/#issue-identifier-algorithm).
     * 
     * @param existing the original bnode id
     * @returns the canonical equivalent
     */
    issueID(existing: BNodeId): BNodeId {
        const issued = this.issued_identifiers_map.get(existing);
        if (issued !== undefined) {
            return issued
        } else {
            const newly_issued: BNodeId = `${this.identifier_prefix}${this.identifier_counter}`;
            this.issued_identifiers_map.set(existing,newly_issued)
            this.identifier_counter++;
            return newly_issued;
        }
    }

    get identifier_map(): Map<BNodeId,BNodeId> {
        return this.issued_identifiers_map;
    }

    /**
     * Has a bnode label been assigned a canonical alternative?
     * 
     * @param existing - the bnode id to be checked
     */
    isSet(existing: BNodeId): boolean {
        return this.issued_identifiers_map.get(existing) !== undefined;
    }

    /**
     * "Deep" copy of this instance.
     */
    copy(): IDIssuer {
        const retval = new IDIssuer(this.identifier_prefix);
        retval.identifier_counter     = this.identifier_counter;
        retval.issued_identifiers_map = new Map(this.issued_identifiers_map);
        return retval;
    }

    /**
     * Iterate over the values in issuance order.
     */
     *[Symbol.iterator](): IterableIterator<[BNodeId,BNodeId]> {
        for (const [key,value] of this.issued_identifiers_map) {
            yield [key,value]
        }
    }

    /**
     * Presentation for logging.
     */
    toLogItem() : LogItem {
        const retval: LogItem = {
            "issuer ID" : `${this.id}`,
            "prefix"    : this.identifier_prefix,
            "counter"   : `${this.identifier_counter}`,
            "mappings"  : this.issued_identifiers_map
        }
        return retval;
    }
}
