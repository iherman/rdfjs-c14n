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
 * @param copy - whether the input should be copied to a local store (e.g., if the input is a generator, or the uniqueness of quads are not guaranteed). If this
 * parameter is not used (i.e., value is `undefined`) the copy is always done _unless_ the input is an `rdf.DatasetCore` instance.
 * @returns - A semantically identical set of Quads using canonical BNode labels, plus other information.
 *
 * @async
 */
export declare function computeCanonicalDataset(state: GlobalState, input: InputDataset, copy?: boolean | undefined): Promise<C14nResult>;
