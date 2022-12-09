/**
 * Calculation of the 1st degree hash
 * 
 * @copyright Ivan Herman 2023
 * 
 * @packageDocumentation
 */

import * as rdf from 'rdf-js';
import { BNodeId, Hash, GlobalState, sort_and_hash_nquads, quad_to_nquad } from './common';

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
 export function compute_first_degree_hash(state: GlobalState, identifier: BNodeId): Hash {
    /* @@@ */ state.logger.info(`§4.7.3 entering function:\n  identifier: ${identifier}`);

    // Step 1
    const nquads: string[] = [];
    // Step 2,3: Collect all quads that includes the blank node that we are talking about.
    // For each of those quads create a "fake" one just differentiating between this blank node and
    // a possible other.
    // The collected quads must be sorted and hashed, providing a (hopefully unique) hash that
    // characterizes the bnode.
    state.bnode_to_quads[identifier].forEach((quad: rdf.Quad): void => {
        // Get the 'fake' quad term to be used for hashing.
        const map_term = (t: rdf.Term): rdf.Term => {
            if (t.termType === "BlankNode") {
                return (t.value === identifier) ? state.data_factory.blankNode('a') : state.data_factory.blankNode('z');
            } else {
                return t
            }
        }
        const new_term = state.data_factory.quad(
            map_term(quad.subject) as rdf.Quad_Subject, 
            quad.predicate, 
            map_term(quad.object) as rdf.Quad_Object,
            map_term(quad.graph) as rdf.Quad_Graph
        );
        nquads.push(quad_to_nquad(new_term))
    })

    // Step 4 (hopefully javascript does the right thing in terms of unicode)
    // Step 5
    const the_hash: Hash = sort_and_hash_nquads(state, nquads)

    /* @@@ */ state.logger.info(`§4.7.3 First degree quads (unsorted):\n  quads: {${nquads}\n  hash: ${the_hash}`);
    return the_hash;
}
