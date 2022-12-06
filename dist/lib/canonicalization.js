"use strict";
/**
 * Top level entry point for the canonicalization algorithm.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.compute_canonicalized_graph = void 0;
const hash_1_degree_quads_1 = require("./hash_1_degree_quads");
const hash_n_degree_quads_1 = require("./hash_n_degree_quads");
const issue_identifier_1 = require("./issue_identifier");
/**
 * Implementation of the main algorithmic [steps on the top level](https://www.w3.org/TR/rdf-canon/##canon-algo-algo) for the details.
 *
 * @param state - the overall canonicalization state + interface to the underlying RDF environment
 * @param input_dataset
 * @returns
 */
function compute_canonicalized_graph(state, input_dataset) {
    // Re-initialize the state information: canonicalization should always start with a clean state
    state.bnode_to_quads = {};
    state.hash_to_bnodes = {};
    state.canonical_issuer = new issue_identifier_1.IdIssuer();
    const retval = state.dataset_factory.dataset();
    // Step 2
    // All quads are 'classified' depending on what bnodes they contain
    // Results in a mapping from bnodes to all quads that they are part of.
    {
        for (const quad of input_dataset) {
            const bnode_map = (t) => {
                if (t.termType === "BlankNode") {
                    const bnode = t.value;
                    if (state.bnode_to_quads[bnode] === undefined) {
                        state.bnode_to_quads[bnode] = [quad];
                    }
                    else {
                        state.bnode_to_quads[bnode].push(quad);
                    }
                }
            };
            bnode_map(quad.subject);
            bnode_map(quad.object);
            bnode_map(quad.graph);
        }
    }
    /* @@@ */ state.logger.debug(`§4.5.3 (2) bnode to quads: ${JSON.stringify(state.bnode_to_quads, null, 4)}`);
    // Step 3
    {
        // Compute a hash value for each bnode (depending on the quads it appear in)
        // In simple cases a hash value refers to one bnode only; in unlucky cases there
        // may be more. Hence the usage of the hash_to_bnodes map.
        Object.keys(state.bnode_to_quads).forEach((n) => {
            // Step 3.1
            const hfn = (0, hash_1_degree_quads_1.compute_first_degree_hash)(state, n);
            // Step 3.2
            if (state.hash_to_bnodes[hfn] === undefined) {
                state.hash_to_bnodes[hfn] = [n];
            }
            else {
                state.hash_to_bnodes[hfn].push(n);
            }
        });
        /* @@@ */ state.logger.info(`§4.5.3 (3) hash to bnodes: \n${state.hash_to_bnodes}`);
    }
    // Step 4
    {
        // For each hash take the corresponding bnode, and issue a new, canonical id in a sequence.
        // This works only for those hashes where there is one associated bnode; for the ones
        // where this is not the case, step 5 will kick in later.
        // It is important to order the hashes, because it influences the order of issuing the canonical ids.
        // If a bnode is "handled", ie, it does have a canonical ID, it is removed from the
        // state structure on hash->bnodes. 
        const hashes = Object.keys(state.hash_to_bnodes).sort();
        for (const hash of hashes) {
            const identifier_list = state.hash_to_bnodes[hash];
            // Step 4.1
            // Filter out the nasty cases
            if (identifier_list.length > 1)
                continue;
            // Step 4.2
            // Here is the essential part: issue the canonical identifier.
            // Note that the IdIssuer automatically stores the (existing, issued) pairs for the
            // bnode identifier; these are retrieved in the last step when a new, normalized
            // graph is created.
            const canon_id = state.canonical_issuer.issue_id(identifier_list[0]);
            /* @@@ */ state.logger.info(`§4.5.3 (4) canonicalization of ${identifier_list[0]} -> ${canon_id}`);
            // Step 4.3
            // Remove the corresponding hash
            delete state.hash_to_bnodes[hash];
        }
    }
    // Step 5
    // This step takes care of the bnodes that do not have been canonicalized in the previous step,
    // because their simple, first degree hashes are not unique.
    {
        const hashes = Object.keys(state.hash_to_bnodes).sort();
        for (const hash of hashes) {
            const identifier_list = state.hash_to_bnodes[hash];
            /* @@@ */ state.logger.info(`§4.5.3 (5) identifier list with shared hashes: ${identifier_list} for hash: ${hash}`);
            // This cycle takes care of all problematic cases that share the same hash
            // Step 5.1
            // This stores a calculated hash and its relates identifier issuer for each
            // bnode related to this particular hash value
            const hash_path_list = [];
            // Step 5.2
            for (const n of identifier_list) {
                if (state.canonical_issuer.is_set(n)) {
                    // Step 5.2.1
                    continue;
                }
                else {
                    // Step 5.2.2
                    const temporary_issuer = new issue_identifier_1.IdIssuer('b');
                    // Step 5.2.3
                    const bn = temporary_issuer.issue_id(n);
                    // Step 5.2.4
                    const result = (0, hash_n_degree_quads_1.compute_n_degree_hash)(state, n, temporary_issuer);
                    /* @@@ */ state.logger.debug(`§4.5.3 (5.2.4) computed n-degree hash: ${JSON.stringify(result, null, 4)}`);
                    hash_path_list.push(result);
                }
            }
            /* @@@ */ state.logger.info(`§4.5.3 (5.2) hash path list: ${JSON.stringify(hash_path_list, null, 4)}`);
            // Step 5.3
            const ordered_hash_path_list = hash_path_list.sort((a, b) => {
                if (a.hash < b.hash)
                    return -1;
                else if (a.hash > b.hash)
                    return 1;
                else
                    return 0;
            });
            for (const result of ordered_hash_path_list) {
                // Step 5.3.1
                for (const [existing, temporary] of result.issuer) {
                    state.canonical_issuer.issue_id(existing);
                }
            }
        }
    }
    // Step 6
    {
        // This function replaces the term with its canonical equivalent, if applicable
        const replace_bnode = (term) => {
            if (term.termType === "BlankNode") {
                const canonical = state.canonical_issuer.issue_id(term.value);
                return state.data_factory.blankNode(canonical);
            }
            else {
                return term;
            }
        };
        for (const quad of input_dataset) {
            // Step 6.1 & 6.2
            const subject_copy = replace_bnode(quad.subject);
            const object_copy = replace_bnode(quad.object);
            const graph_copy = replace_bnode(quad.graph);
            retval.add(state.data_factory.quad(subject_copy, quad.predicate, object_copy, graph_copy));
        }
    }
    // Step 7
    /* @@@ */ state.logger.debug(`§4.5.3 Leaving function\n${JSON.stringify(state, null, 4)}`);
    return retval;
}
exports.compute_canonicalized_graph = compute_canonicalized_graph;
