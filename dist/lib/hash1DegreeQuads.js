"use strict";
/**
 * Calculation of the 1st degree hash
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeFirstDegreeHash = void 0;
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
 * @returns - hash value
 */
function computeFirstDegreeHash(state, identifier) {
    /* @@@ */
    state.logger.push("h1dg");
    state.logger.info("h1dg.1", "Entering Hash First Degree Quads function (4.7.3)", { identifier });
    /* @@@ */
    // Step 1
    const nquads = [];
    // Step 2,3: Collect all quads that includes the blank node that we are talking about.
    // For each of those quads create a "fake" one just differentiating between this blank node and
    // a possible other.
    // The collected quads must be sorted and hashed, providing a (hopefully unique) hash that
    // characterizes the bnode.
    state.bnode_to_quads[identifier].forEach((quad) => {
        // Get the 'fake' quad term to be used for hashing.
        const mapTerm = (term) => {
            if (term.termType === "BlankNode") {
                return (term.value === identifier) ? state.dataFactory.blankNode('a') : state.dataFactory.blankNode('z');
            }
            else {
                return term;
            }
        };
        const new_term = state.dataFactory.quad(mapTerm(quad.subject), quad.predicate, mapTerm(quad.object), mapTerm(quad.graph));
        nquads.push((0, common_1.quadToNquad)(new_term));
    });
    // Step 4 (hopefully javascript does the right thing in terms of unicode)
    nquads.sort();
    // Step 5
    const the_hash = (0, common_1.hashNquads)(state, nquads);
    /* @@@ */
    state.logger.info("h1dg.5", "Leaving Hash First Degree Quads function (4.7.3).", {
        identifier,
        "quads": nquads,
        "hash": the_hash
    });
    state.logger.pop();
    /* @@@ */
    return the_hash;
}
exports.computeFirstDegreeHash = computeFirstDegreeHash;
