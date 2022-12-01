"use strict";
/**
 * Calculation of the n-degree hash.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.compute_n_degree_hash = void 0;
const common_1 = require("./common");
const hash_1_degree_quads_1 = require("./hash_1_degree_quads");
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
function compute_hash_related_blank_node(state, related, quad, issuer, position) {
    const get_identifier = () => {
        if (state.canonical_issuer.is_set(related)) {
            return state.canonical_issuer.issue_id(related);
        }
        else if (issuer.is_set(related)) {
            return issuer.issue_id(related);
        }
        else {
            return (0, hash_1_degree_quads_1.compute_first_degree_hash)(state, related);
        }
    };
    // Step 1
    const identifier = get_identifier();
    // Step 2
    let input = position;
    // Step 3
    if (position !== 'g') {
        input = `${input}<${quad.predicate.value}>`;
    }
    // Step 4
    input = `${input}${identifier}`;
    // Step 5
    return (0, common_1.compute_hash)(input);
}
/**
 * Compute the n-degree hash
 *
 * See the [specification](https://www.w3.org/TR/rdf-canon/#hash-nd-quads-algorithm) for the details.
 *
 * @param state
 * @param identifier
 * @param issuer
 * @returns
 */
function compute_n_degree_hash(state, identifier, issuer) {
    /* @@@ */ state.logger.info(`§4.9.3 entering function, identifier: ${identifier}, issuer: ${JSON.stringify(issuer, null, 4)}`);
    // Step 1
    const Hn = {};
    // Step 2, 3
    // Calculate a unique hash for all other bnodes that are immediately connected to 'identifier'
    // Note that this step will, in possible recursive calls, create additional steps for the "gossips"
    for (const quad of state.bnode_to_quads[identifier]) {
        // Step 3.1
        const per_component = (t, position) => {
            if (t.termType === "BlankNode" && (0, common_1.get_bnodeid)(t) !== identifier) {
                // Step 3.1.1
                const hash = compute_hash_related_blank_node(state, (0, common_1.get_bnodeid)(t), quad, issuer, position);
                // Step 3.1.2
                if (Hn[hash] === undefined) {
                    Hn[hash] = [(0, common_1.get_bnodeid)(t)];
                }
                else {
                    Hn[hash].push((0, common_1.get_bnodeid)(t));
                }
            }
        };
        per_component(quad.subject, 's');
        per_component(quad.object, 'o');
        per_component(quad.graph, 'g');
    }
    /* @@@ */ state.logger.info(`§4.9.3, (3) Hn: ${JSON.stringify(Hn, null, 4)}`);
    // Step 4
    let data_to_hash = '';
    // Step 5
    const hashes = Object.keys(Hn).sort();
    for (const hash of hashes) {
        // Step 5.1
        data_to_hash = `${data_to_hash}${hash}`;
        // Step 5.2
        let chosen_path = '';
        // Step 5.3
        let chosen_issuer;
        // Step 5.4
        // This is a bit unnecessarily complicated, because the
        // 'permutation' package has a strange bug: if the array to be handled
        // has, in fact, one element, then the result of permutations is empty...
        //
        const perms = Hn[hash].length === 1 ? [Hn[hash]] : Array.from(permutation(Hn[hash]));
        perms: for (const p of perms) {
            // Step 5.4.1
            let issuer_copy = issuer.copy();
            // Step 5.4.2
            let path = '';
            // Step 5.4.3
            const recursion_list = [];
            // Step 5.4.4
            for (const related of p) {
                if (state.canonical_issuer.is_set(related)) {
                    // Step 5.4.4.1
                    path = `${path}${state.canonical_issuer.issue_id(related)}`;
                }
                else {
                    // Step 5.4.4.2
                    if (!issuer_copy.is_set(related)) {
                        recursion_list.push(related);
                    }
                    path = `${path}${issuer_copy.issue_id(related)}`;
                }
                // Step 5.4.4.3
                if (chosen_path.length > 0 && path.length >= chosen_path.length && path > chosen_path) {
                    continue perms;
                }
            }
            // Step 5.4.5
            for (const related of recursion_list) {
                // Step 5.4.5.1
                const result = compute_n_degree_hash(state, related, issuer_copy);
                // Step 5.4.5.2
                path = `${path}${issuer_copy.issue_id(related)}`;
                // Step 5.4.5.3
                path = `${path}<${result.hash}>`;
                // Step 5.4.5.4
                issuer_copy = result.issuer;
                // Step 5.4.5.5
                if (chosen_path.length > 0 && path.length >= chosen_path.length && path > chosen_path) {
                    continue perms;
                }
            }
            // Step 5.4.6
            if (chosen_path.length === 0 || path < chosen_path) {
                chosen_path = path;
                chosen_issuer = issuer_copy;
            }
        }
        // Step 5.5.
        data_to_hash = `${data_to_hash}${chosen_path}`;
        /* @@@ */ state.logger.info(`§4.9.3 \n  chosen path: ${chosen_path}, \n  data to hash: ${data_to_hash}`);
        // Step 5.6
        issuer = chosen_issuer;
    }
    // Step 6
    const retval = {
        hash: (0, common_1.compute_hash)(data_to_hash),
        issuer: issuer
    };
    /* @@@ */ state.logger.info(`§4.9.3 leaving function: ${JSON.stringify(retval, null, 4)}`);
    return retval;
}
exports.compute_n_degree_hash = compute_n_degree_hash;
