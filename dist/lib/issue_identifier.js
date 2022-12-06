"use strict";
/**
 * Issue Identifier
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdIssuer = void 0;
const common_1 = require("./common");
/**
 * Issue Identifier.
 *
 * See [the specification](https://www.w3.org/TR/rdf-canon/#issue-identifier-algorithm) for the details, except that all
 * functionalities are encapsulated in one class.
 */
class IdIssuer {
    _prefix;
    _counter;
    _issued_id_map;
    /**
     *
     * @param prefix - the prefix used for the generated IDs
     */
    constructor(prefix = common_1.Constants.BNODE_PREFIX) {
        this._prefix = prefix;
        this._counter = 0;
        this._issued_id_map = new Map();
    }
    /**
     * Issue a new canonical identifier.
     *
     * See [the specification](https://www.w3.org/TR/rdf-canon/#issue-identifier-algorithm).
     *
     * @param existing the original bnode id
     * @returns the canonical equivalent
     */
    issue_id(existing) {
        const issued = this._issued_id_map.get(existing);
        if (issued !== undefined) {
            return issued;
        }
        else {
            const newly_issued = `${this._prefix}${this._counter}`;
            this._issued_id_map.set(existing, newly_issued);
            this._counter++;
            return newly_issued;
        }
    }
    /**
     * Has a bnode already been canonicalized?
     *
     * @param existing - the bnode id to be checked
     */
    is_set(existing) {
        return this._issued_id_map.get(existing) !== undefined;
    }
    /**
     * "Deep" copy of this instance
     */
    copy() {
        const retval = new IdIssuer(this._prefix);
        retval._counter = this._counter;
        retval._issued_id_map = new Map(this._issued_id_map);
        return retval;
    }
    /**
     * Iterate over the values in issuance order
     */
    *[Symbol.iterator]() {
        for (const [key, value] of this._issued_id_map) {
            yield [key, value];
        }
    }
}
exports.IdIssuer = IdIssuer;
