"use strict";
/**
 * Calculation of the 1st degree hash
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.compute_first_degree_hash = void 0;
const common_1 = require("./common");
/**
 * Compute the first degree hash: a simple hash based on the immediate "surrounding" of a blank node, ie, quads that the
 * blank node is part of. Ideally, the result uniquely characterizes the blank node (but not always...).
 *
 * See [algorithm details in the spec](https://www.w3.org/TR/rdf-canon/#hash-1d-quads-algorithm), and
 * the separate [overview](https://w3c.github.io/rdf-canon/spec/#hash-1d-quads-overview).
 *
 * @param state
 * @param identifier
 * @returns
 */
function compute_first_degree_hash(state, identifier) {
    /* @@@ */ state.logger.info(`§4.7.3 entering function:\n  identifier: ${identifier}`);
    // Step 1
    const nquads = [];
    // Step 2,3: Collect all quads that includes the blank node that we are talking about.
    // For each of those quads create a "fake" one just differentiating between this blank node and
    // a possible other.
    // The collected quads must be sorted and hashed, providing a (hopefully unique) hash that
    // characterizes the bnode.
    state.bnode_to_quads[identifier].forEach((quad) => {
        // Get the 'fake' quad term to be used for hashing.
        const map_term = (t) => {
            if (t.termType === "BlankNode") {
                return (t.value === identifier) ? state.data_factory.blankNode('a') : state.data_factory.blankNode('z');
            }
            else {
                return t;
            }
        };
        const new_term = state.data_factory.quad(map_term(quad.subject), quad.predicate, map_term(quad.object), map_term(quad.graph));
        nquads.push((0, common_1.quad_to_nquad)(new_term));
    });
    // Step 4 (hopefully javascript does the right thing in terms of unicode)
    // Step 5
    const the_hash = (0, common_1.sort_and_hash_nquads)(nquads);
    /* @@@ */ state.logger.info(`§4.7.3 First degree quads (unsorted):\n  quads: {${nquads}\n  hash: ${the_hash}`);
    return the_hash;
}
exports.compute_first_degree_hash = compute_first_degree_hash;
