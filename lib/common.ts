import { createHash } from 'crypto';

export namespace Constants {
    /** The hashing algorithm's name used in the module */
    export const HASH_ALGORITHM = "sha256";

    /** The prefix used for all generated canonical bnode IDs */
    export const BNODE_PREFIX = "_:c14n";
}

/**
 * Return the hash of a string.
 * 
 * @param data 
 * @returns 
 */
export function hash(data: string): string {
    return createHash(Constants.HASH_ALGORITHM).update(data).digest('hex');
}
