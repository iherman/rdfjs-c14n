import { createHash } from 'crypto';
import * as rdf from "rdf-js";
import { DataFactory, Graph, GraphContainer } from './rdfjs';

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

export type BNodeId = string;
export type Hash    = string;

interface IdListItem {
    existing : BNodeId;
    issued   : BNodeId;
}

const issued_id_list: IdListItem[] = [];

export class IdIssuer {
    prefix: string;
    counter: number;

    constructor() {
        this.prefix  = Constants.BNODE_PREFIX;
        this.counter = 0;
    }

    issue_id(existing: BNodeId): BNodeId {
        const list_item = issued_id_list.find((item: IdListItem): boolean => item.existing === existing)
        if (list_item !== undefined) {
            return list_item.issued
        } else {
            const issued: BNodeId = `${this.prefix}${this.counter}`;
            issued_id_list.push({existing, issued});
            this.counter++;
            return issued;
        }
    }
}

interface BNodeToQuads {
    [index: BNodeId]: rdf.Quad[];
}

interface HashToBNodes {
    [index: Hash]: BNodeId[];
}

export interface C14nState {
    bnode_to_quads:   BNodeToQuads;
    hash_to_bnodes:   HashToBNodes;
    canonical_issuer: IdIssuer;
}
