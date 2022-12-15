/**
 * Help to debug: function to compute the hash of a string and display on the CLI line.
 * The function used to perform the hash is the one used in the algorithm.
 */
import { Hash }                               from '../../index';
import { IdIssuer }                           from '../../lib/issue_identifier';
import { C14nState, Constants, compute_hash } from '../../lib/common';


if (process.argv[2]) {
    const fake_state: C14nState = {
        bnode_to_quads   : {},
        hash_to_bnodes   : {},
        canonical_issuer : new IdIssuer(),
        hash_algorithm   : Constants.HASH_ALGORITHM,
    }
    const hash: Hash = compute_hash(fake_state, process.argv[2]);
    console.log(`Hash of "${process.argv[2]}" is "${hash}"`)
} else {
    console.log("Usage: hash input");
}
