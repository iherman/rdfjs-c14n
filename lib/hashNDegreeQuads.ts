/**
 * Calculation of the n-degree hash.
 * 
 * @copyright Ivan Herman 2023
 * 
 * @packageDocumentation
 */

import * as rdf                                                                                  from 'rdf-js';
import { BNodeId, Hash, NDegreeHashResult, HashToBNodes, GlobalState, computeHash, quadToNquad } from './common';
import { computeFirstDegreeHash }                                                                from './hash1DegreeQuads';
import { IDIssuer }                                                                              from './issueIdentifier';
const permutation = require('array-permutation');

/**
 * Hash Related Blank Node algorithm. Returns a unique hash value for a bnode that is in the same quad as the one
 * considered in the main loop. The value of 'position' is used to differentiate the situation when the
 * bnode here is in a subject, object, or graph position.
 * 
 * See the [specification](https://www.w3.org/TR/rdf-canon/#hash-related-algorithm) for the details.
 * 
 * @param state 
 * @param related 
 * @param quad 
 * @param issuer 
 * @param position 
 * @returns 
 */
 function computeHashRelatedBlankNode(state: GlobalState, related: BNodeId, quad: rdf.Quad, issuer: IDIssuer, position: string): Hash {
    /* @@@ */ 
    state.logger.push("hrbn");
    state.logger.info("hrbn.1", "Entering Hash Related Blank Node function (4.7.3)", {
        "related": related,
        "quad": quadToNquad(quad),
    });
    /* @@@ */ 

    const getIdentifier = (): BNodeId => {
        if (state.canonical_issuer.isSet(related)) {
            return `_:${state.canonical_issuer.issueID(related)}`;
        } else if (issuer.isSet(related)) {
            return `_:${issuer.issueID(related)}`;
        } else {
            return computeFirstDegreeHash(state, related)
        }    
    };

    // Step 1
    const identifier: BNodeId = getIdentifier();

    // Step 2
    let input: string = position;

    // Step 3
    if (position !== 'g') {
        input = `${input}<${quad.predicate.value}>`
    }

    // Step 4
    input = `${input}${identifier}`;

    // Step 5
    const hash: Hash = computeHash(state,input);

    /* @@@ */ 
    state.logger.debug("hrbn.5", "Leaving Hash Related Blank Node function (4.7.3 (4))", {
        "input to hash": input,
        hash
    });
    state.logger.pop();
    /* @@@ */ 

    // Step 5
    return hash;
}


/**
 * Compute the n-degree hash. See the [specification](https://www.w3.org/TR/rdf-canon/#hash-nd-quads-algorithm) for the details.
 * 
 * @param state 
 * @param identifier 
 * @param issuer 
 * @returns
 */
 export function computeNDegreeHash(state: GlobalState, identifier: BNodeId, issuer: IDIssuer): NDegreeHashResult {
    /* @@@ */
    state.logger.push("hndq");
    state.logger.info("hndq.1", "Entering Hash N-Degree Quads function (4.8.3).", {
        identifier,
        "issuer": state.canonical_issuer.toLogItem(),
    });
    /* @@@ */
 
    // Step 1
    const Hn: HashToBNodes = {};

    // Step 2, 3
    // Calculate a unique hash for all other bnodes that are immediately connected to 'identifier'
    // Note that this step will, in possible recursive calls, create additional steps for the "gossips"
    {
        /* @@@ */ state.logger.push("hndq.3")
        for (const quad of state.bnode_to_quads[identifier]) {
            /* @@@ */ state.logger.push("hndq.3.1","", {quad: quadToNquad(quad)});
            // Step 3.1
            const processTerm = (term: rdf.Term, position: string): void => {
                /* @@@ */ state.logger.push("hndq.3.1.1","", {term: term.value});
                if (term.termType === "BlankNode" &&  term.value !== identifier) {
                    // Step 3.1.1
                    const hash = computeHashRelatedBlankNode(state, term.value, quad,  issuer, position);
                    // Step 3.1.2
                    if (Hn[hash] === undefined) {
                        Hn[hash] = [term.value];
                    } else {
                        Hn[hash].push(term.value)
                    }
                }
                state.logger.pop();
            }
            processTerm(quad.subject,'s');
            processTerm(quad.object, 'o');
            processTerm(quad.graph,  'g');
            /* @@@ */ state.logger.pop();
        }

        /* @@@ */ 
        state.logger.debug("hndq.3.extra", "Hash N-Degree Quads function (4.8.3 (3))", { 
            "Hash to bnodes" : Hn
        });
        state.logger.pop();
        /* @@@ */
    }

    // Step 4
    let data_to_hash: string = '';

    // Step 5
    {
        /* @@@ */ state.logger.push("hndq.5");

        const hashes: Hash[] = Object.keys(Hn).sort();
        for (const hash of hashes) {
            /* @@@ */ 
            state.logger.info("hndq.5.1", "Hash N-Degree Quads function (4.8.3 (5)), entering loop", {
                hash,
                "data to hash": data_to_hash
            });
            /* @@@ */

            // Step 5.1
            data_to_hash = `${data_to_hash}${hash}`;

            // Step 5.2
            let chosen_path: string = '';

            // Step 5.3
            let chosen_issuer: IDIssuer;

            // Step 5.4
            // This is a bit unnecessarily complicated, because the
            // 'permutation' package has a strange bug: if the array to be handled
            // has, in fact, one element, then the result of permutations is empty...
            //
            state.logger.push("hndq.5.4")
            const perms: BNodeId[][] = Hn[hash].length === 1 ? [Hn[hash]] : Array.from(permutation(Hn[hash]));
            perms: for (const p of perms) {
                /* @@@ */ 
                state.logger.info("hndq.5.4.1", "Hash N-Degree Quads function (4.8.3 (5.4)), entering loop", {
                    p,
                    "chosen path": chosen_path
                });
                /* @@@ */

                // Step 5.4.1
                let issuer_copy: IDIssuer = issuer.copy();

                // Step 5.4.2
                let path: string = '';

                // Step 5.4.3
                const recursion_list: BNodeId[] = [];

                // Step 5.4.4
                state.logger.push("hndq.5.4.4")
                for (const related of p) {
                    /* @@@ */ 
                    state.logger.info("hndq.5.4.4.1", "Hash N-Degree Quads function (4.8.3 (5.4.4)), entering loop", { related, path });
                    /* @@@ */ 

                    if (state.canonical_issuer.isSet(related)) {
                        // Step 5.4.4.1
                        path = `${path}_:${state.canonical_issuer.issueID(related)}`;
                    } else {
                        // Step 5.4.4.2
                        if (!issuer_copy.isSet(related)) {
                            recursion_list.push(related);
                        }
                        path = `${path}_:${issuer_copy.issueID(related)}`;
                    }
                    // Step 5.4.4.3
                    if (chosen_path.length > 0 && path.length >= chosen_path.length &&  path > chosen_path) {
                        state.logger.pop();
                        continue perms;
                    }
                }
                state.logger.pop();

                /* @@@ */ 
                state.logger.debug("hndq.5.4.5.extra", "Hash N-Degree Quads function (4.8.3 (5.4.5)), before possible recursion.", {
                    "recursion list": recursion_list,
                    path
                });
                /* @@@ */

                // Step 5.4.5
                /* @@@ */ if (recursion_list.length !== 0) state.logger.push("hndq.5.4.5.");
                for (const related of recursion_list) {
                    // Step 5.4.5.1
                    // This is the computationally dangerous point in the algorithm!
                    const result: NDegreeHashResult = computeNDegreeHash(state, related, issuer_copy);

                    // Step 5.4.5.2
                    path = `${path}_:${issuer_copy.issueID(related)}`;

                    // Step 5.4.5.3
                    path = `${path}<${result.hash}>`;

                    // Step 5.4.5.4
                    issuer_copy = result.issuer;

                    /* @@@ */ 
                    state.logger.info("hndq.5.4.5.4", "Hash N-Degree Quads function (4.8.3 (5.4.5.4)), combine result of recursion.", {
                        path,
                        "issuer copy": issuer_copy.toLogItem(),
                    });
                    /* @@@ */

                    // Step 5.4.5.5
                    if (chosen_path.length > 0 && path.length >= chosen_path.length && path > chosen_path) {
                        continue perms;
                    }
                }
                /* @@@ */ if (recursion_list.length !== 0) state.logger.pop();

                // Step 5.4.6
                if (chosen_path.length === 0 || path < chosen_path) {
                    chosen_path   = path;
                    chosen_issuer = issuer_copy;
                }
            }
            /* @@@ */ state.logger.pop();

            // Step 5.5.
            data_to_hash = `${data_to_hash}${chosen_path}`;
            
            /* @@@ */ 
            state.logger.info("hndq.5.5", "Hash N-Degree Quads function (4.8.3 (5.5). End of current loop with Hn hashes", {
                "chosen path": chosen_path,
                "data to hash": data_to_hash
            });
            /* @@@ */ 

            // Step 5.6
            issuer = chosen_issuer;
        }
        state.logger.pop();
    }

    // Step 6
    const retval: NDegreeHashResult = {
        hash: computeHash(state, data_to_hash),
        issuer: issuer
    }

    /* @@@ */ 
    state.logger.info("hndq.6", "Leaving Hash N-Degree Quads function (4.8.3).", {
        "hash": retval.hash,
        "issuer": retval.issuer.toLogItem()
    });
    state.logger.pop();
    /* @@@ */ 
    
    return retval;
}
