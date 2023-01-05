/**
 * Top level entry point for the canonicalization algorithm.
 * 
 * @copyright Ivan Herman 2023
 * 
 * @packageDocumentation
 */

import * as rdf from 'rdf-js';
import { GlobalState, BNodeId, Hash, Quads, NDegreeHashResult, DatasetShell } from './common';
import { computeFirstDegreeHash }                                             from './hash1DegreeQuads';
import { computeNDegreeHash }                                                 from './hashNDegreeQuads';
import { IDIssuer }                                                           from './issueIdentifier';
import { bntqToLogItem, ndhrToLogItem }                                       from './logging';


/**
 * Implementation of the main [steps on the top level](https://www.w3.org/TR/rdf-canon/#canon-algo-algo) of the algorithm specification.
 * 
 * @param state - the overall canonicalization state + interface to the underlying RDF environment
 * @param input
 * @returns - A semantically identical set of Quads, with canonical BNode labels. The exact format of the output depends on the format of the input. If the input is a Set or an Array, so will be the return. If it is a Dataset, and the `datasetFactory` field in the [global state](../interfaces/lib_common.GlobalState.html) is set, it will be a Dataset, otherwise a Set.
 */
export function computeCanonicalDataset(state: GlobalState, input: Quads): Quads {
        // Re-initialize the state information: canonicalization should always start with a clean state
        state.bnode_to_quads   = {};
        state.hash_to_bnodes   = {};
        state.canonical_issuer = new IDIssuer();

        const input_dataset: DatasetShell = new DatasetShell(input);
        const retval: DatasetShell        = input_dataset.new(state);

        // Step 2
        // All quads are 'classified' depending on what bnodes they contain
        // Results in a mapping from bnodes to all quads that they are part of.
        {
            for (const quad of input_dataset) {
                const bnode_map = (t: rdf.Term): void => {
                    if (t.termType === "BlankNode") {
                        const bnode: BNodeId = t.value;
                        if (state.bnode_to_quads[bnode] === undefined) {
                            state.bnode_to_quads[bnode] = [quad];
                        } else {
                            state.bnode_to_quads[bnode].push(quad);
                        }
                    }
                }
                bnode_map(quad.subject);
                bnode_map(quad.object);
                bnode_map(quad.graph);
            }
        }

        /* @@@ */ 
        state.logger.info("Entering the canonicalization function (4.5.3 (2)).", { 
            "Bnode to quads" : bntqToLogItem(state.bnode_to_quads)
        });
        /* @@@ */ 

        // Step 3
        {
            // Compute a hash value for each bnode (depending on the quads it appear in)
            // In simple cases a hash value refers to one bnode only; in unlucky cases there
            // may be more. Hence the usage of the hash_to_bnodes map.
            Object.keys(state.bnode_to_quads).forEach((n: BNodeId): void => {
                // Step 3.1
                const hfn: Hash = computeFirstDegreeHash(state, n)
                // Step 3.2
                if (state.hash_to_bnodes[hfn] === undefined) {
                    state.hash_to_bnodes[hfn] = [n];
                } else {
                    state.hash_to_bnodes[hfn].push(n);
                }
            });
        }

        // Step 4
        {
            // For each hash take the corresponding bnode, and issue a new, canonical id in a sequence.
            // This works only for those hashes where there is one associated bnode; for the ones
            // where this is not the case, step 5 will kick in later.
            // It is important to order the hashes, because it influences the order of issuing the canonical ids.
            // If a bnode is "handled", ie, it does have a canonical ID, it is removed from the
            // state structure on hash->bnodes. 
            const hashes: Hash[] = Object.keys(state.hash_to_bnodes).sort();
            for (const hash of hashes) {
                const identifier_list: BNodeId[] = state.hash_to_bnodes[hash];
                // Step 4.1
                // Filter out the nasty cases
                if (identifier_list.length > 1) continue;

                // Step 4.2
                // Here is the essential part: issue the canonical identifier.
                // Note that the IdIssuer automatically stores the (existing, issued) pairs for the
                // bnode identifier; these are retrieved in the last step when a new, normalized
                // graph is created.
                const canon_id = state.canonical_issuer.issueID(identifier_list[0]);
                /* @@@ */ 
                state.logger.info("Canonicalization function (4.5.3 (4)).", {
                    "Identifier in first pass": `${identifier_list[0]}=>${canon_id}`
                });
                /* @@@ */ 

                // Step 4.3
                // Remove the corresponding hash
                delete state.hash_to_bnodes[hash];
            }
        }

        // Step 5
        // This step takes care of the bnodes that do not have been canonicalized in the previous step,
        // because their simple, first degree hashes are not unique.
        {
            const hashes: Hash[] = Object.keys(state.hash_to_bnodes).sort();
            for (const hash of hashes) {
                const identifier_list: BNodeId[] = state.hash_to_bnodes[hash];
                // This cycle takes care of all problematic cases that share the same hash
                // Step 5.1
                // This stores a calculated hash and its relates identifier issuer for each
                // bnode related to this particular hash value
                const hash_path_list: NDegreeHashResult[] = [];

                // Step 5.2
                for (const n of identifier_list) {
                    if (state.canonical_issuer.isSet(n)) {
                        // Step 5.2.1
                        continue;
                    } else {
                        // Step 5.2.2
                        const temporary_issuer = new IDIssuer('b');
                        // Step 5.2.3
                        const bn = temporary_issuer.issueID(n);
                        // Step 5.2.4
                        const result: NDegreeHashResult = computeNDegreeHash(state, n, temporary_issuer);
                        hash_path_list.push(result);
                    }
                }

                /* @@@ */ 
                state.logger.info("Canonicalization function, after (4.5.3 (5.2))",{
                    "computed for": hash,
                    "hash path list": ndhrToLogItem(hash_path_list)
                });
                /* @@@ */ 

                // Step 5.3
                const ordered_hash_path_list = hash_path_list.sort((a: NDegreeHashResult,b: NDegreeHashResult): number => {
                    if (a.hash < b.hash)      return -1;
                    else if (a.hash > b.hash) return 1;
                    else                      return 0;
                });
                for (const result of ordered_hash_path_list) {
                    // Step 5.3.1
                    for (const [existing,temporary] of result.issuer) {
                        state.canonical_issuer.issueID(existing)
                    }
                }
            }
        }

        // Step 6
        {
            // This function replaces the term with its canonical equivalent, if applicable
            const replace_bnode = (term: rdf.Term): rdf.Term => {
                if (term.termType === "BlankNode") {
                    const canonical = state.canonical_issuer.issueID(term.value);
                    return state.dataFactory.blankNode(canonical)
                } else {
                    return term;
                }
            };
            for (const quad of input_dataset) {
                // Step 6.1 & 6.2
                const subject_copy = replace_bnode(quad.subject) as rdf.Quad_Subject;
                const object_copy  = replace_bnode(quad.object) as rdf.Quad_Object;
                const graph_copy   = replace_bnode(quad.graph) as rdf.Quad_Graph;
                retval.add(state.dataFactory.quad(subject_copy, quad.predicate, object_copy, graph_copy))
            }
        }

        // Step 7
        /* @@@ */ 
        state.logger.info("Leaving the canonicalization function (4.5.3)", {
            "issuer": state.canonical_issuer.toLogItem(),
        });
        /* @@@ */ 
        return retval.dataset;
    }

