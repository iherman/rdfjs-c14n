"use strict";
/**
 * Issue Identifier
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IDIssuer = void 0;
const common_1 = require("./common");
/**
 * Issue Identifier.
 *
 * See [the specification](https://www.w3.org/TR/rdf-canon/#issue-identifier-algorithm) for the details, except that all
 * functionalities are encapsulated in a class.
 */
class IDIssuer {
    // This is mainly used to provide a readable ID at debug/logging time...
    static IDIssuerID = 1234;
    // ... for each instance; it is only used for debugging purposes.
    id;
    // See [the specification](https://www.w3.org/TR/rdf-canon/#issue-identifier-algorithm)
    identifier_prefix;
    identifier_counter;
    issued_identifiers_map;
    /**
     *
     * @param prefix - the prefix used for the generated IDs
     */
    constructor(prefix = common_1.Constants.BNODE_PREFIX) {
        this.id = IDIssuer.IDIssuerID++;
        this.identifier_prefix = prefix;
        this.identifier_counter = 0;
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
    issueID(existing) {
        const issued = this.issued_identifiers_map.get(existing);
        if (issued !== undefined) {
            return issued;
        }
        else {
            const newly_issued = `${this.identifier_prefix}${this.identifier_counter}`;
            this.issued_identifiers_map.set(existing, newly_issued);
            this.identifier_counter++;
            return newly_issued;
        }
    }
    /**
     * Has a bnode label been assigned a canonical alternative?
     *
     * @param existing - the bnode id to be checked
     */
    isSet(existing) {
        return this.issued_identifiers_map.get(existing) !== undefined;
    }
    /**
     * "Deep" copy of this instance.
     */
    copy() {
        const retval = new IDIssuer(this.identifier_prefix);
        retval.identifier_counter = this.identifier_counter;
        retval.issued_identifiers_map = new Map(this.issued_identifiers_map);
        return retval;
    }
    /**
     * Iterate over the values in issuance order.
     */
    *[Symbol.iterator]() {
        for (const [key, value] of this.issued_identifiers_map) {
            yield [key, value];
        }
    }
    /**
     * Presentation for logging.
     */
    toLogItem() {
        const values = [...this.issued_identifiers_map].map(([key, value]) => `${key}=>${value}`);
        const retval = {
            "issuer ID": `${this.id}`,
            "prefix": this.identifier_prefix,
            "counter": `${this.identifier_counter}`,
            "mappings": values
        };
        return retval;
    }
}
exports.IDIssuer = IDIssuer;
