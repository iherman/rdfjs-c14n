/**
 * Help to debug: function to compute the hash of a string and display on the CLI line.
 * The function used to perform the hash is the one used in the algorithm.
 */
import { Hash }                              from '../../index';
import { IDIssuer }                          from '../../lib/issueIdentifier';
import { C14nState, computeHash }            from '../../lib/common';
import * as config                           from '../../lib/config';


function main(alg: string, _data: string) {
    const fake_state: C14nState = {
        bnode_to_quads   : {},
        hash_to_bnodes   : {},
        canonical_issuer : new IDIssuer(),
        hash_algorithm   : alg,
    }
    const hash: Hash = computeHash(fake_state, process.argv[2]);
    console.log(`"${alg}" hash of "${process.argv[2]}" is "${hash}"`)
}


if (process.argv[2]) {
    const not_supported: string[] = [];
    for (const alg of config.HASH_ALGORITHMS) {
        try {
            main(alg, process.argv[2]);
        } catch(e) {
            not_supported.push(alg)
        }
    }
    console.log(`\nNot supported: ${not_supported}`);
} else {
    console.log("Usage: hash input");
}
