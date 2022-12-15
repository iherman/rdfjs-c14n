/**
 * Issue Identifier
 * 
 * @copyright Ivan Herman 2023
 * 
 * @packageDocumentation
 */

import { Constants, BNodeId } from './common';

let IssuIdentifierID = 1234;

/**
 * Issue Identifier.
 * 
 * See [the specification](https://www.w3.org/TR/rdf-canon/#issue-identifier-algorithm) for the details, except that all
 * functionalities are encapsulated in one class.
 */
export class IDIssuer {
    private id            : number;
    private prefix        : string;
    private counter       : number;
    private issued_id_map : Map<BNodeId,BNodeId>;

    /**
     * 
     * @param prefix - the prefix used for the generated IDs
     */
    constructor(prefix: string = Constants.BNODE_PREFIX) {
        this.id             = IssuIdentifierID++;
        this.prefix         = prefix;
        this.counter        = 0;
        this.issued_id_map  = new Map();
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
        const issued = this.issued_id_map.get(existing);
        if (issued !== undefined) {
            return issued
        } else {
            const newly_issued: BNodeId = `${this.prefix}${this.counter}`;
            this.issued_id_map.set(existing,newly_issued)
            this.counter++;
            return newly_issued;
        }
    }

    /**
     * Has a bnode already been canonicalized?
     * 
     * @param existing - the bnode id to be checked
     */
    isSet(existing: BNodeId): boolean {
        return this.issued_id_map.get(existing) !== undefined;
    }

    /**
     * "Deep" copy of this instance
     */
    copy(): IDIssuer {
        const retval          = new IDIssuer(this.prefix);
        retval.counter       = this.counter;
        retval.issued_id_map = new Map(this.issued_id_map);
        return retval;
    }

    /**
     * Iterate over the values in issuance order 
     */
     *[Symbol.iterator](): IterableIterator<[BNodeId,BNodeId]> {
        for (const [key,value] of this.issued_id_map) {
            yield [key,value]
        }
    }

    /**
     * Presentation for debug
     */
    toString(): string {
        const values: string[] = [...this.issued_id_map].map( ([key, value]): string =>  `${key}=>${value}`);
        return `\n  issuer ID: ${this.id}\n  prefix: ${this.prefix}\n  counter: ${this.counter}\n  mappings: [${values}]`;
    }
}
