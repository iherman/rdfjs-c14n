/**
 * Calculation of the n-degree hash.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
import { BNodeId, NDegreeHashResult, GlobalState } from './common';
import { IDIssuer } from './issueIdentifier';
/**
 * Compute the n-degree hash. See the [specification](https://www.w3.org/TR/rdf-canon/#hash-nd-quads-algorithm) for the details.
 *
 * @throws RangeError - the maximum number of calls have been reached
 *
 * @param state
 * @param identifier
 * @param issuer
 * @returns
 * @async
 */
export declare function computeNDegreeHash(state: GlobalState, identifier: BNodeId, issuer: IDIssuer): Promise<NDegreeHashResult>;
