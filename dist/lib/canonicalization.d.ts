/**
 * Top level entry point for the canonicalization algorithm.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
import { GlobalState, InputDataset, C14nResult } from './common';
/**
 * Implementation of the main [steps on the top level](https://www.w3.org/TR/rdf-canon/#canon-algo-algo) of the algorithm specification.
 *
 * @param state - the overall canonicalization state + interface to the underlying RDF environment
 * @param input
 * @param deduplicate - whether duplicate quads should be removed from the input
 * @returns - A semantically identical set of Quads, with canonical BNode labels, plus other information.
 *
 * @async
 */
export declare function computeCanonicalDataset(state: GlobalState, input: InputDataset, deduplicate?: boolean): Promise<C14nResult>;
