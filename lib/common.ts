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

export class IdIssuer {
    private _prefix: string;
    private _counter: number;
    private _issued_id_list: IdListItem[];

    constructor() {
        this._prefix         = Constants.BNODE_PREFIX;
        this._counter        = 0;
        this._issued_id_list = [];
    }

    issue_id(existing: BNodeId): BNodeId {
        const list_item = this._issued_id_list.find((item: IdListItem): boolean => item.existing === existing)
        if (list_item !== undefined) {
            return list_item.issued
        } else {
            const issued: BNodeId = `${this._prefix}${this._counter}`;
            this._issued_id_list.push({existing, issued});
            this._counter++;
            return issued;
        }
    }

    map_to_canonical(existing: BNodeId): BNodeId {
        const item: IdListItem = this._issued_id_list.find((value: IdListItem): boolean => value.existing === existing)
        return (item) ? item.issued : existing;
    }

    get issued_id_list() : IdListItem[] {
        return this._issued_id_list;
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
