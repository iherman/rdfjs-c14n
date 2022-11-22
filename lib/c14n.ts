import * as rdf                                      from 'rdf-js';
import { C14nState, BNodeId, Hash, Graph, RDF_Impl } from './types';
import { hash, IdIssuer }                            from './utils';

export class URDNA2015 {
    state: C14nState;
    rdf_impl: RDF_Impl;

    constructor(rdf_impl: RDF_Impl) {
        this.state = {
            bnode_to_quads: {},
            hash_to_bnodes: {},
            canonical_issuer: new IdIssuer(),
        }
        this.rdf_impl = rdf_impl;
    }

    /**
     * Implementation of the "Hash First Degree Quads" algorithm in the spec
     * 
     * @param reference_id 
     */
    compute_first_degree_hashes(reference_id: BNodeId): Hash {
        // Step 1
        const nquads: string[] = [];
        // Step 2,3
        this.state.bnode_to_quads[reference_id].forEach((quad: rdf.Quad): void => {
            // A new quad is created in the rfdjs terms to get the nquad created properly.
            const map_term = (t: rdf.Term): rdf.Term => {
                if (t.termType === "BlankNode") {
                    const bid = `_:${t.value}`;
                    return (bid === reference_id) ? this.rdf_impl.data_factory.blankNode('a') : this.rdf_impl.data_factory.blankNode('z');
                } else {
                    return t
                }
            }
            const new_term = this.rdf_impl.data_factory.quad(
                map_term(quad.subject) as rdf.Quad_Subject, 
                quad.predicate, 
                map_term(quad.object) as rdf.Quad_Object,
                map_term(quad.graph) as rdf.Quad_Graph
            );
            nquads.push(this.rdf_impl.quad_to_nquad(new_term))
        })
        // Step 4 (hopefully javascript does the right thing in terms of unicode)
        nquads.sort();
        // Step 5 (hopefully the join() means what is required in the spec)
        console.log(nquads);
        const the_hash: Hash = hash(nquads.join());
        console.log(the_hash);
        return the_hash
    }

    compute_n_degree_hashes() {}

    canonicalize(input_dataset: Graph): Graph {
        const retval: Graph = new Set();

        // Step 2
        // All quads are 'classified' depending on what bnodes they contain
        // Results in a mapping from bnodes to all quads that they are part of.
        {
            for (const quad of input_dataset) {
                const bnode_map = (t: rdf.Term): void => {
                    if (t.termType === "BlankNode") {
                        // The value property does not return the '_:' part, whereas the
                        // algorithm is defined in terms of the full blank node id...
                        const bnode: BNodeId = `_:${t.value}`;
                        if (this.state.bnode_to_quads[bnode] === undefined) {
                            this.state.bnode_to_quads[bnode] = [quad];
                        } else {
                            this.state.bnode_to_quads[bnode].push(quad);
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
        let non_normalized_ids: BNodeId[] = Object.keys(this.state.bnode_to_quads);

        // Step 4
        // --- in FPWD: let simple: boolean = true;

        // Step 5
        // --- in FPWD: while(simple) {
        {
            // Step 5.1
            // --- in FPWD: simple = false;

            // Step 5.2 
            this.state.hash_to_bnodes = {};

            // Step 5.3
            // Compute a hash value for each bnode (depending on the quads it appear in)
            // In simple cases a hash value refers to one bnode only; in unlucky cases there
            // may be more. Hence the usage of the hash_to_bnodes map.
            non_normalized_ids.forEach((n: BNodeId): void => {
                // Step 5.3.1
                const hfn: Hash = this.compute_first_degree_hashes(n)
                // Step 5.3.2
                if (this.state.hash_to_bnodes[hfn] === undefined) {
                    this.state.hash_to_bnodes[hfn] = [n];
                } else {
                    this.state.hash_to_bnodes[hfn].push(n);
                }
            });

            // Step 5.4
            // For each hash take the corresponding bnode, and issue a new, canonical id in a sequence.
            // This works only for those hashes where there is one associated bnode; for the ones
            // where this is not the case, step 6 will kick in later.
            // It is important to order the hashes, because the order of issuing the canonical id is
            // important.
            const hashes: Hash[] = Object.keys(this.state.hash_to_bnodes).sort();
            for (const hash of hashes) {
                const identifier_list: BNodeId[] = this.state.hash_to_bnodes[hash];
                // Step 5.4.1
                // Filter out the nasty cases
                if (identifier_list.length > 1) continue;

                // Step 5.4.2
                // Here is the essential part: issue the canonical identifier.
                // Note that the IdIssuer automatically stores the (existing, issued) pairs for the
                // bnode identifier.
                const existing_id = identifier_list[0];
                const issued_id: BNodeId = this.state.canonical_issuer.issue_id(existing_id);

                // Step 5.4.3
                // Remove the bnode from the list of those that still need to be normalized
                //
                // Not sure this is the most efficient thing to do, but I go
                // for clarity rather than efficiency at this point.
                non_normalized_ids = non_normalized_ids.filter((key: BNodeId): boolean => key !== existing_id);

                // Step 5.4.4
                // Also remove the corresponding hash
                delete this.state.hash_to_bnodes[hash];

                // Step 5.4.5
                // --- in FPWD: simple = true;
            }
        }

        // Step 6
        {
            const hashes: Hash[] = Object.keys(this.state.hash_to_bnodes).sort();
            if (hashes.length > 0) {
                console.log("This is the complex case that should not occur at this point yet!!!")
            }
        }

        // Step 7
        {
            // This function replaces the term with its canonical equivalent, if applicable
            const replace_bnode = (term: rdf.Term): rdf.Term => {
                if (term.termType === "BlankNode") {
                    const canonical = this.state.canonical_issuer.map_to_canonical(`_:${term.value}`);
                    // Remove the `_:` before creating the new bnode...
                    return this.rdf_impl.data_factory.blankNode(canonical.slice(2))
                } else {
                    return term;
                }
            };
            for (const quad of input_dataset) {
                // Step 7.1 & 7.2
                const subject_copy = replace_bnode(quad.subject) as rdf.Quad_Subject;
                const object_copy  = replace_bnode(quad.object) as rdf.Quad_Object;
                const graph_copy   = replace_bnode(quad.graph) as rdf.Quad_Graph;
                retval.add(this.rdf_impl.data_factory.quad(subject_copy,quad.predicate,object_copy,graph_copy))
            }
        }
        return retval;
    }

    debug() {
        console.log(JSON.stringify(this.state,null,4));
    }
}
