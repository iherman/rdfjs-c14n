/**
 * Issue Identifier class.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
import { BNodeId } from './common';
import { LogItem } from './logging';
/**
 * Issue Identifier.
 *
 * See [the specification](https://www.w3.org/TR/rdf-canon/#issue-identifier-algorithm) for the details, except that all
 * functionalities are encapsulated in a class.
 */
export declare class IDIssuer {
    private static _IDIssuerID;
    private _id;
    private _identifier_prefix;
    private _identifier_counter;
    private _issued_identifiers_map;
    /**
     *
     * @param prefix - the prefix used for the generated IDs.
     */
    constructor(prefix?: string);
    /**
     * Accessor to the issued identifier map, to be returned as part of the return
     * structure for the main algorithm.
     */
    get issued_identifier_map(): Map<BNodeId, BNodeId>;
    /**
     * Issue a new canonical identifier.
     *
     * See [the specification](https://www.w3.org/TR/rdf-canon/#issue-identifier-algorithm).
     *
     * @param existing the original bnode id
     * @returns the canonical equivalent (which may have been newly minted in the process)
     */
    issueID(existing: BNodeId): BNodeId;
    /**
     * Mapping from a blank node to its canonical equivalent;
     * this method is necessary to use this instance as part
     * of the return structure for the canonicalizer function.
     */
    map(id: BNodeId): BNodeId;
    /**
     * Has a bnode label been assigned a canonical alternative?
     *
     * @param existing - the bnode id to be checked
     */
    isSet(existing: BNodeId): boolean;
    /**
     * "Deep" copy of this instance.
     */
    copy(): IDIssuer;
    /**
     * Iterate over the values in issuance order.
     */
    [Symbol.iterator](): IterableIterator<[BNodeId, BNodeId]>;
    /**
     * Presentation for logging.
     */
    toLogItem(): LogItem;
}
