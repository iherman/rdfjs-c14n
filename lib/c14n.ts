import * as rdf from "rdf-js";
import { C14nState, BNodeId, Hash, IdIssuer, hash,  } from './common';
import { DataFactory, Graph, GraphContainer, quad_to_nquad } from './rdfjs';

export class URDNA2015 {
    state: C14nState;

    constructor() {
        this.state = {
            bnode_to_quads: {},
            hash_to_bnodes: {},
            canonical_issuer: new IdIssuer(),
        }
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
                    return (bid === reference_id) ? DataFactory.blankNode('a') : DataFactory.blankNode('z');
                } else {
                    return t
                }
            }
            const new_term = DataFactory.quad(
                map_term(quad.subject) as rdf.Quad_Subject, 
                quad.predicate, 
                map_term(quad.object) as rdf.Quad_Object,
                map_term(quad.graph) as rdf.Quad_Graph
            );
            nquads.push(quad_to_nquad(new_term))
        })
        // Step 4 (hopefully javascript does the right thing in terms of unicode)
        nquads.sort();
        // Step 5 (hopefully the join() means what is required in the spec)
        return hash(nquads.join())
    }

    label_unique_nodes() {}
    compute_n_degree_hashes() {}
    label_remaining_nodes() {}
    finish() {}

    canonicalize(input_dataset: Graph): Graph {
        const retval: Graph = new Set();

        // Step 2: 
        {
            for (const quad of input_dataset) {
                const bnode_map = (t: rdf.Term): void => {
                    if (t.termType === "BlankNode") {
                        const bnode: BNodeId = `_:${t.value}`;
                        if (this.state.bnode_to_quads[bnode] === undefined) {
                            this.state.bnode_to_quads[bnode] = [];
                        }
                        this.state.bnode_to_quads[bnode].push(quad);
                    }
                }
                bnode_map(quad.subject);
                // If this was a generalized graph: bnode_maps(quad.predicate);
                bnode_map(quad.object);
                bnode_map(quad.graph);
            }
        }

        // Step 3
        const non_normalized_ids = Object.keys(this.state.bnode_to_quads);

        // Step 4
        let simple: boolean = true;

        // Step 5
        while(simple) {
            simple = false;
            non_normalized_ids.forEach((n: BNodeId): void => {
                this.compute_first_degree_hashes(n)
                // ITT TARTOK!!!!
            });


        }


        return retval;
    }
    debug() {
        console.log(JSON.stringify(this.state,null,4));
    }
}
