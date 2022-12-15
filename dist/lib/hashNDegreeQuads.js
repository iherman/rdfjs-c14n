"use strict";
/**
 * Calculation of the n-degree hash.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeNDegreeHash = void 0;
const common_1 = require("./common");
const hash1DegreeQuads_1 = require("./hash1DegreeQuads");
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
function computeHashRelatedBlankNode(state, related, quad, issuer, position) {
    /* @@@ */ state.logger.info(`Entering Hash Related Blank Node function (4.8.3), with related: "${related}" and quad "${(0, common_1.quadToNquad)(quad)}"`);
    const getIdentifier = () => {
        if (state.canonical_issuer.isSet(related)) {
            return state.canonical_issuer.issueID(related);
        }
        else if (issuer.isSet(related)) {
            return issuer.issueID(related);
        }
        else {
            return (0, hash1DegreeQuads_1.computeFirstDegreeHash)(state, related);
        }
    };
    // Step 1
    const identifier = getIdentifier();
    // Step 2
    let input = position;
    // Step 3
    if (position !== 'g') {
        input = `${input}<${quad.predicate.value}>`;
    }
    // Step 4
    input = `${input}_:${identifier}`;
    // Step 5
    const hash = (0, common_1.computeHash)(state, input);
    /* @@@ */ state.logger.info(`Leaving Hash Related Blank Node function (4.8.3 (4)):\n  input to hash: "${input}"\n  hash value: "${hash}"`);
    // Step 5
    return hash;
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
function computeNDegreeHash(state, identifier, issuer) {
    /* @@@ */ state.logger.info(`Entering Hash N-Degree Quads function (4.9.3). Identifier: "${identifier}",  issuer: ${issuer.toString()}`);
    // Step 1
    const Hn = {};
    // Step 2, 3
    // Calculate a unique hash for all other bnodes that are immediately connected to 'identifier'
    // Note that this step will, in possible recursive calls, create additional steps for the "gossips"
    for (const quad of state.bnode_to_quads[identifier]) {
        // Step 3.1
        const processTerm = (term, position) => {
            if (term.termType === "BlankNode" && term.value !== identifier) {
                // Step 3.1.1
                const hash = computeHashRelatedBlankNode(state, term.value, quad, issuer, position);
                // Step 3.1.2
                if (Hn[hash] === undefined) {
                    Hn[hash] = [term.value];
                }
                else {
                    Hn[hash].push(term.value);
                }
            }
        };
        processTerm(quad.subject, 's');
        processTerm(quad.object, 'o');
        processTerm(quad.graph, 'g');
    }
    /* @@@ */ state.logger.info(`Hash N-Degree Quads function (4.9.3 (3)).\nHn: ${JSON.stringify(Hn, null, 4)}`);
    // Step 4
    let data_to_hash = '';
    // Step 5
    const hashes = Object.keys(Hn).sort();
    for (const hash of hashes) {
        /* @@@ */ state.logger.info(`Hash N-Degree Quads function (4.9.3 (5)).\n  Entering loop with hash value "${hash}". Data to hash: "${data_to_hash}"`);
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
            /* @@@ */ state.logger.info(`Hash N-Degree Quads function (4.9.3 (5.4)).\n  Entering permutation loop with "${p}"\n  chosen path: "${chosen_path}"`);
            // Step 5.4.1
            let issuer_copy = issuer.copy();
            // Step 5.4.2
            let path = '';
            // Step 5.4.3
            const recursion_list = [];
            // Step 5.4.4
            for (const related of p) {
                /* @@@ */ state.logger.info(`Hash N-Degree Quads function (4.9.3 (5.4.4)).\n  Entering loop with related: "${related}"\n  path: "${path}"`);
                // if (state.canonical_issuer.is_set(related)) {
                //     // Step 5.4.4.1
                //     path = `${path}_:${state.canonical_issuer.issue_id(related)}`;
                if (issuer.isSet(related)) {
                    // Step 5.4.4.1
                    path = `${path}_:${related}`;
                }
                else {
                    // Step 5.4.4.2
                    if (!issuer_copy.isSet(related)) {
                        recursion_list.push(related);
                    }
                    path = `${path}_:${issuer_copy.issueID(related)}`;
                }
                // Step 5.4.4.3
                if (chosen_path.length > 0 && path.length >= chosen_path.length && path > chosen_path) {
                    continue perms;
                }
            }
            /* @@@ */ state.logger.info(`Hash N-Degree Quads function (4.9.3 (5.4.5)), before possible recursion. Recursion list: "${recursion_list}"\n  path: "${path}"`);
            // Step 5.4.5
            for (const related of recursion_list) {
                // Step 5.4.5.1
                const result = computeNDegreeHash(state, related, issuer_copy);
                // Step 5.4.5.2
                path = `${path}_:${issuer_copy.issueID(related)}`;
                // Step 5.4.5.3
                path = `${path}<${result.hash}>`;
                // Step 5.4.5.4
                issuer_copy = result.issuer;
                /* @@@ */ state.logger.info(`Hash N-Degree Quads function (4.9.3 (5.4.5.4)), combine result of recursion.\n  path: "${path}"\n  issuer copy: ${issuer_copy.toString()}`);
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
        /* @@@ */ state.logger.info(`Hash N-Degree Quads function (4.9.3 (5.5). End of current loop with Hn hashes\n  chosen path: "${chosen_path}", \n  data to hash: "${data_to_hash}"`);
        // Step 5.6
        issuer = chosen_issuer;
    }
    // Step 6
    const retval = {
        hash: (0, common_1.computeHash)(state, data_to_hash),
        issuer: issuer
    };
    /* @@@ */ state.logger.info(`Leaving Hash N-Degree Quads function (4.9.3).\n  hash: ${retval.hash}  ${retval.issuer.toString()}`);
    return retval;
}
exports.computeNDegreeHash = computeNDegreeHash;
