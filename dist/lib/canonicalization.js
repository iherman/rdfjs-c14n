"use strict";
/**
 * Top level entry point for the canonicalization algorithm.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeCanonicalDataset = void 0;
const common_1 = require("./common");
const hash1DegreeQuads_1 = require("./hash1DegreeQuads");
const hashNDegreeQuads_1 = require("./hashNDegreeQuads");
const issueIdentifier_1 = require("./issueIdentifier");
const logging_1 = require("./logging");
/**
 * A trivial mapping from blank nodes to their IDs; the return value is used
 * as part of the canonicalization return structure
 */
const createBidMap = (graph) => {
    // We collect the bnodes from the graph in one place,
    // using a Set will automatically remove duplicates
    const bnodes = new Set();
    const addBnode = (term) => {
        if (term.termType === "BlankNode") {
            bnodes.add(term);
        }
    };
    graph.forEach((quad) => {
        addBnode(quad.subject);
        addBnode(quad.object);
        addBnode(quad.graph);
    });
    return new Map(Array.from(bnodes).map((node) => [node, node.value]));
};
/**
 * Implementation of the main [steps on the top level](https://www.w3.org/TR/rdf-canon/#canon-algo-algo) of the algorithm specification.
 *
 * @param state - the overall canonicalization state + interface to the underlying RDF environment
 * @param input
 * @returns - A semantically identical set of Quads, with canonical BNode labels. The exact format of the output depends on the format of the input. If the input is a Set or an Array, so will be the return. If it is an N-Quads document (string) then the return is a Set of Quads.
 *
 * @async
 */
async function computeCanonicalDataset(state, input) {
    // Re-initialize the state information: canonicalization should always start with a clean state
    state.bnode_to_quads = {};
    state.hash_to_bnodes = {};
    state.canonical_issuer = new issueIdentifier_1.IDIssuer();
    state.current_n_degree_call = 0;
    // The input to the algorithm can be either an nQuads document, or a dataset
    // representation with Quads. This function makes the nQuad document "disappear" from
    // the rest of the processing.
    const convertToQuads = (inp) => {
        if (typeof inp === 'string') {
            return (0, common_1.parseNquads)(inp);
        }
        else if (Array.isArray(inp)) {
            return new Set(inp);
        }
        else {
            return inp;
        }
    };
    const input_dataset = convertToQuads(input);
    const retval = new Set();
    // Step 2
    // All quads are 'classified' depending on what bnodes they contain
    // Results in a mapping from bnodes to all quads that they are part of.
    //
    // Note that the algorithm is slightly simpler than in the spec, because there
    // no need for a separate "map entry" because in RDF-JS each term carries its
    // own ID directly
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
            // The algorithm is not prepared for generalized graphs, ie, predicates cannot be bnodes
            bnode_map(quad.object);
            bnode_map(quad.graph);
        }
    }
    // "Side step" (not directly in the specification): the number of bnodes is used to set the maximum number of hash-n-degree-quads call
    // This is the mechanism used to avoid poison graphs.
    state.maximum_n_degree_call = state.complexity_number * Object.keys(state.bnode_to_quads).length;
    /* @@@ */
    state.logger.info("ca.2", "Entering the canonicalization function (4.4.3 (2)).", {
        "Bnode to quads": (0, logging_1.bntqToLogItem)(state.bnode_to_quads)
    });
    /* @@@ */
    // Step 3
    {
        /* @@@ */ state.logger.push("ca.3");
        /* @@@ */ state.logger.push("ca.3.1");
        // Compute a hash value for each bnode (depending on the quads it appear in)
        // In simple cases a hash value refers to one bnode only; in unlucky cases there
        // may be more. Hence the usage of the hash_to_bnodes map.
        // The code below serializes a series of Promise references which is not nice
        // However, if I use a Promise.all, although that works, it messes up the log entries' order for some reasons
        // Because, deep underneath all, the hash function operates on in-memory data in one block (as opposed to streaming),
        // it probably does not really matter speed-wise...
        for (const n of Object.keys(state.bnode_to_quads)) {
            const hfn = await (0, hash1DegreeQuads_1.computeFirstDegreeHash)(state, n);
            // Step 3.2
            if (state.hash_to_bnodes[hfn] === undefined) {
                state.hash_to_bnodes[hfn] = [n];
            }
            else {
                state.hash_to_bnodes[hfn].push(n);
            }
        }
        /* @@@ */ state.logger.pop();
        /* @@@ */
        state.logger.info("ca.3.2", "Calculated first degree hashes (4.4.3. (3))", {
            "Hash to bnodes": (0, logging_1.htbnToLogItem)(state.hash_to_bnodes)
        });
        state.logger.pop();
        /* @@@ */
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
        const logItems = [];
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
            const canon_id = state.canonical_issuer.issueID(identifier_list[0]);
            /* @@@ */
            logItems.push({
                "identifier": identifier_list[0],
                "hash": hash,
                "canonical id": canon_id
            });
            /* @@@ */
            // Step 4.3
            // Remove the corresponding hash
            delete state.hash_to_bnodes[hash];
        }
        /* @@@ */
        state.logger.info("ca.4", "Canonicalization function (4.4.3 (4)).", ...logItems);
        /* @@@ */
    }
    // Step 5
    // This step takes care of the bnodes that do not have been canonicalized in the previous step,
    // because their simple, first degree hashes are not unique.
    {
        /* @@@ */
        state.logger.push("ca.5", "Calculate hashes for identifiers with shared hashes (4.4.3. (5)).");
        state.logger.debug("ca.5.extra", "", {
            "Hash to bnodes": (0, logging_1.htbnToLogItem)(state.hash_to_bnodes)
        });
        /* @@@ */
        const hashes = Object.keys(state.hash_to_bnodes).sort();
        /* @@@ */ if (hashes.length > 0)
            state.logger.push("ca.5.1");
        for (const hash of hashes) {
            const identifier_list = state.hash_to_bnodes[hash];
            // This cycle takes care of all problematic cases that share the same hash
            // Step 5.1
            // This stores a calculated hash and its relates identifier issuer for each
            // bnode related to this particular hash value
            const hash_path_list = [];
            // Step 5.2
            /* @@@ */ state.logger.push("ca.5.2");
            for (const n of identifier_list) {
                if (state.canonical_issuer.isSet(n)) {
                    // Step 5.2.1
                    continue;
                }
                else {
                    // Step 5.2.2
                    const temporary_issuer = new issueIdentifier_1.IDIssuer('b');
                    // Step 5.2.3
                    // Note that bn is not used as a separate value; putting the variable declaration in comment
                    // to make eslint happy
                    /* const bn = */ temporary_issuer.issueID(n);
                    // Step 5.2.4
                    const result = await (0, hashNDegreeQuads_1.computeNDegreeHash)(state, n, temporary_issuer);
                    hash_path_list.push(result);
                }
            }
            /* @@@ */ state.logger.pop();
            // Step 5.3
            const ordered_hash_path_list = hash_path_list.sort((a, b) => {
                if (a.hash < b.hash)
                    return -1;
                else if (a.hash > b.hash)
                    return 1;
                else
                    return 0;
            });
            /* @@@ */
            state.logger.debug("ca.5.2.extra", "Canonicalization function, after (4.4.3 (5.2)), ordered hash past list.", {
                "computed for": hash,
                "hash path list": (0, logging_1.ndhrToLogItem)(ordered_hash_path_list)
            });
            /* @@@ */
            for (const result of ordered_hash_path_list) {
                // Step 5.3.1
                for (const [existing, _temporary] of result.issuer) {
                    state.canonical_issuer.issueID(existing);
                }
            }
        }
        /* @@@ */ if (hashes.length > 0)
            state.logger.pop();
        /* @@@ */ state.logger.pop();
    }
    // Step 6
    {
        // This function replaces the term with its canonical equivalent, if applicable
        const replace_bnode = (term) => {
            if (term.termType === "BlankNode") {
                const canonical = state.canonical_issuer.issueID(term.value);
                return state.dataFactory.blankNode(canonical);
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
            retval.add(state.dataFactory.quad(subject_copy, quad.predicate, object_copy, graph_copy));
        }
    }
    /* @@@ */
    state.logger.info("ca.6", "Leaving the canonicalization function (4.4.3)", {
        "issuer": state.canonical_issuer.toLogItem(),
    });
    /* @@@ */
    // Step 7
    const return_value = {
        canonical_form: (0, common_1.concatNquads)((0, common_1.quadsToNquads)(retval)),
        canonicalized_dataset: Array.isArray(input) ? [...retval] : retval,
        bnode_identifier_map: createBidMap(retval),
        issued_identifier_map: state.canonical_issuer.issued_identifier_map,
    };
    return return_value;
}
exports.computeCanonicalDataset = computeCanonicalDataset;
