"use strict";
/**
 * Implementation of the RDF Canonicalization Algorithm, published by the W3C RCH Working Group.
 * See [specification](https://www.w3.org/TR/rdf-canon/) for the latest official version.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RDFCanon = void 0;
const common_1 = require("./lib/common");
const issue_identifier_1 = require("./lib/issue_identifier");
const canonicalization_1 = require("./lib/canonicalization");
/**
 * Just a shell around the algorithm, consisting of a state, and the call for the real implementation.
 *
 * The variable parts of the state, as [defined in the spec](https://www.w3.org/TR/rdf-canon/#dfn-canonicalization-state),
 * are re-initialized at a call to the canonicalize call. Ie, the same class instance can be reused for
 * {@link RDFCanon#canonicalize} for different graphs.
 */
class RDFCanon {
    _state;
    /**
     * @constructor
     * @param data_factory  An implementation of the generic RDF DataFactory interface, see [the specification](http://rdf.js.org/data-model-spec/#datafactory-interface)
     * @param quad_to_nquad A function that converts an `rdf.Quad` into a bona fide nquad string
     * @param logger        A logger instance; defaults to an "empty" logger, ie, no logging happens
     */
    constructor(data_factory, dataset_factory, logger = new common_1.NopLogger()) {
        this._state = {
            bnode_to_quads: {},
            // This will map a calculated hash value to the bnodes it characterizes. In
            // simple cases it is a 1-1 mapping but, sometimes, it is a 1-many.
            // This structure is filled in step 5
            hash_to_bnodes: {},
            canonical_issuer: new issue_identifier_1.IdIssuer(),
            data_factory: data_factory,
            dataset_factory: dataset_factory,
            logger: logger
        };
    }
    /**
     * Implementation of the main algorithmic steps, see [separate overview in the spec](https://www.w3.org/TR/rdf-canon/#canon-algo-overview). The
     * real work is done in [separate](../functions/lib_canonicalization.compute_canonicalized_graph.html) function.
     *
     * @param input_dataset
     * @returns
     */
    canonicalize(input_dataset) {
        return (0, canonicalization_1.compute_canonicalized_graph)(this._state, input_dataset);
    }
}
exports.RDFCanon = RDFCanon;
