import * as rdf from 'rdf-js';
import { GlobalState, BNodeId, Hash, Graph, NDegreeHashResult, QuadToNquad } from './types';
import { IdIssuer, compute_n_degree_hashes, compute_first_degree_hashes, get_bnodeid } from './utils';

export class URDNA2015 {
    private _state:    GlobalState;

    /**
     * 
     * @param data_factory  An implementation of the generic RDF DataFactory interface, see http://rdf.js.org/data-model-spec/#datafactory-interface
     * @param quad_to_nquad A function that converts an rdf.Quad into a bona fide nquad string
     */
    constructor(data_factory: rdf.DataFactory, quad_to_nquad: QuadToNquad) {
        this._state = {
            bnode_to_quads   : {},
            // This will map a calculated hash value to the bnodes it characterizes. In
            // simple cases it is a 1-1 mapping but, sometimes, it is a 1-many.
            // This structure is filled in step 5
            hash_to_bnodes   : {},
            canonical_issuer : new IdIssuer(),
            data_factory     : data_factory,
            quad_to_nquad    : quad_to_nquad
        }
    }

    private initialize() {
        this._state.bnode_to_quads   = {};
        this._state.hash_to_bnodes   = {};
        this._state.canonical_issuer = new IdIssuer();
    }

    /**
     * Implementation of the main algorithmic steps
     * 
     * @param input_dataset 
     * @returns 
     */
    canonicalize(input_dataset: Graph): Graph {
        // Re-initialize the state information: canonicalization should always start with a clean state
        this.initialize();

        const retval: Graph = new Set();

        // Step 2
        // All quads are 'classified' depending on what bnodes they contain
        // Results in a mapping from bnodes to all quads that they are part of.
        {
            for (const quad of input_dataset) {
                const bnode_map = (t: rdf.Term): void => {
                    if (t.termType === "BlankNode") {
                        const bnode: BNodeId = get_bnodeid(t);
                        if (this._state.bnode_to_quads[bnode] === undefined) {
                            this._state.bnode_to_quads[bnode] = [quad];
                        } else {
                            this._state.bnode_to_quads[bnode].push(quad);
                        }
                    }
                }
                bnode_map(quad.subject);
                // If this was a generalized graph: bnode_maps(quad.predicate);
                bnode_map(quad.object);
                bnode_map(quad.graph);
            }
        }

        // Step 3
        // Collect the list of bnodes in a separate list for easier reference...
        // This will store the list of bnodes that have not yet received a canonical id.
        // Obviously, it initializes to the full list of bnodes in the input
        let non_normalized_ids: BNodeId[] = Object.keys(this._state.bnode_to_quads);

        // Step 4
        {
            // Compute a hash value for each bnode (depending on the quads it appear in)
            // In simple cases a hash value refers to one bnode only; in unlucky cases there
            // may be more. Hence the usage of the hash_to_bnodes map.
            non_normalized_ids.forEach((n: BNodeId): void => {
                // Step 4.1
                const hfn: Hash = compute_first_degree_hashes(n, this._state)
                // Step 4.2
                if (this._state.hash_to_bnodes[hfn] === undefined) {
                    this._state.hash_to_bnodes[hfn] = [n];
                } else {
                    this._state.hash_to_bnodes[hfn].push(n);
                }
            });
        }

        // Step 5
        {
            // For each hash take the corresponding bnode, and issue a new, canonical id in a sequence.
            // This works only for those hashes where there is one associated bnode; for the ones
            // where this is not the case, step 6 will kick in later.
            // It is important to order the hashes, because the order of issuing the canonical id is
            // important.
            // If a bnode is "handled", ie, it does have a canonical ID, it is removed from the
            // state structure on hash->bnodes as well as the list of not-yet-normalized bnodes. 
            const hashes: Hash[] = Object.keys(this._state.hash_to_bnodes).sort();
            for (const hash of hashes) {
                const identifier_list: BNodeId[] = this._state.hash_to_bnodes[hash];
                // Step 5.1
                // Filter out the nasty cases
                if (identifier_list.length > 1) continue;

                // Step 5.2
                // Here is the essential part: issue the canonical identifier.
                // Note that the IdIssuer automatically stores the (existing, issued) pairs for the
                // bnode identifier; these are retrieved in the last step when a new, normalized
                // graph is created.
                const existing_id = identifier_list[0];
                this._state.canonical_issuer.issue_id(existing_id);

                // Step 5.3
                // Remove the bnode from the list of those that still need to be normalized
                //
                // Not sure this is the most efficient thing to do, but I go
                // for clarity rather than efficiency at this point.
                non_normalized_ids = non_normalized_ids.filter((key: BNodeId): boolean => key !== existing_id);

                // Step 5.4
                // Also remove the corresponding hash
                delete this._state.hash_to_bnodes[hash];
            }
        }

        // Step 6
        // This step takes care of the bnodes that do not have been canonicalized in the previous step,
        // because their simple, first degree hashes are not unique.
        {
            const hashes: Hash[] = Object.keys(this._state.hash_to_bnodes).sort();
            for (const hash of hashes) {
                // This cycle takes care of all problematic cases that share the same hash
                // Step 6.1
                // This stores a calculated hash and its relates identifier issuer for each
                // bnode related to this particular hash value
                const hash_path_list: NDegreeHashResult[] = [];

                // Step 6.2
                for (const bnodeid of this._state.hash_to_bnodes[hash]) {
                    if (this._state.canonical_issuer.is_set(bnodeid)) {
                        // Step 6.2.1
                        continue;
                    } else {
                        // Step 6.2.2
                        const temporary_issuer = new IdIssuer('_:b');
                        // Step 6.2.3
                        const bn = temporary_issuer.issue_id(bnodeid);
                        // Step 6.2.4
                        hash_path_list.push(compute_n_degree_hashes(bnodeid, this._state, temporary_issuer));
                    }
                }

                // 6.3
                const ordered_hash_path_list = hash_path_list.sort((a,b): number => {
                    if (a.hash < b.hash)      return -1;
                    else if (a.hash > b.hash) return 1;
                    else                      return 0;
                });
                for (const result of ordered_hash_path_list) {
                    // 6.3.1
                    for(const existing_identifier of result.issuer.existing_identifiers()) {
                        this._state.canonical_issuer.issue_id(existing_identifier);
                    }
                }
            }
        }

        // Step 6
        {
            // This function replaces the term with its canonical equivalent, if applicable
            const replace_bnode = (term: rdf.Term): rdf.Term => {
                if (term.termType === "BlankNode") {
                    const canonical = this._state.canonical_issuer.issue_id(`_:${term.value}`);
                    // Remove the `_:` before creating the new bnode...
                    return this._state.data_factory.blankNode(canonical.slice(2))
                } else {
                    return term;
                }
            };
            for (const quad of input_dataset) {
                // Step 6.1 & 6.2
                const subject_copy = replace_bnode(quad.subject) as rdf.Quad_Subject;
                const object_copy  = replace_bnode(quad.object) as rdf.Quad_Object;
                const graph_copy   = replace_bnode(quad.graph) as rdf.Quad_Graph;
                retval.add(this._state.data_factory.quad(subject_copy,quad.predicate,object_copy,graph_copy))
            }
        }

        // Step 8
        return retval;
    }

    debug() {
        console.log(JSON.stringify(this._state,null,4));
    }
}
