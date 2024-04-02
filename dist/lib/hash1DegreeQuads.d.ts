/**
 * Calculation of the 1st degree hash.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
import { BNodeId, Hash, GlobalState } from './common';
/**
 * Compute the first degree hash: a simple hash based on the immediate "environment" of a blank node, i.e.,
 * the quads that the blank node is part of. Ideally, the result uniquely characterizes the blank node
 * (but not always...).
 *
 * See [algorithm details in the spec](https://www.w3.org/TR/rdf-canon/#hash-1d-quads-algorithm), and
 * the separate [overview](https://www.w3.org/TR/rdf-canon/spec/#hash-1d-quads-overview).
 *
 * @param state
 * @param identifier
 * @returns - hash value
 *
 * @async
 */
export declare function computeFirstDegreeHash(state: GlobalState, identifier: BNodeId): Promise<Hash>;
