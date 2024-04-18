/**
 * Implementation of the RDF Canonicalization Algorithm, published by the W3C RCH Working Group.
 * See [specification](https://www.w3.org/TR/rdf-canon/) for the latest official version.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
import * as rdf from '@rdfjs/types';
import { Hash, InputDataset, C14nResult } from './lib/common';
import { GetConfigData } from './lib/config';
import { LogLevels, Logger } from './lib/logging';
export { Quads, InputDataset, C14nResult, InputQuads } from './lib/common';
export { Hash, BNodeId } from './lib/common';
export { LogLevels, Logger } from './lib/logging';
export { ConfigData, GetConfigData } from './lib/config';
/**
 * Just a shell around the algorithm, consisting of a state, and the calls to the real implementation.
 *
 * The variable parts of the state, as [defined in the spec](https://www.w3.org/TR/rdf-canon/#dfn-canonicalization-state),
 * are re-initialized at the canonicalize call. Ie, the same class instance can therefore be reused to
 * {@link RDFC10#canonicalize} for different graphs.
 */
export declare class RDFC10 {
    private state;
    /**
     * @constructor
     * @param data_factory  An implementation of the generic RDF DataFactory interface, see [the specification](http://rdf.js.org/data-model-spec/#datafactory-interface). If undefined, the DataFactory of the [n3 package](https://www.npmjs.com/package/n3) is used.
     * @param getConfigData A function returning the configuration data, see {@link ConfigData}. By default, this returns the constant values set in the code; the caller may provide a more complex function to handle environment variables and/or configuration files.
     */
    constructor(data_factory?: rdf.DataFactory, getConfigData?: GetConfigData);
    /**
     * Create and set a logger instance. By default it is an "empty" logger, ie, no logging happens.
     *
     * @param logger
     */
    setLogger(id?: string, level?: LogLevels): Logger | undefined;
    /**
     * Current logger type.
     */
    get logger_type(): string;
    /**
     * List of available logger types.
     */
    get available_logger_types(): string[];
    /**
     * Set the Hash algorithm (default is "sha256").
     * If the algorithm isn't available the value is ignored (and an exception is thrown).
     *
     * The name is considered to be case insensitive. Also, both the format including a '-' dash character or not
     * are accepted (i.e., "sha256" and "sha-256" are both fine).
     *
     * @param algorithm_in: the (case insensitive) name of the algorithm.
     */
    set hash_algorithm(algorithm_in: string);
    get hash_algorithm(): string;
    /**
     * List of available hash algorithm names.
     */
    get available_hash_algorithms(): string[];
    /**
     * Set the maximal complexity number. This number, multiplied with the number of blank nodes in the dataset,
     * sets a maximum number of calls the algorithm can do for the so called "hash n degree quads" function.
     * Setting this number to a reasonably low number (say, 30), ensures that some "poison graphs" would not result in
     * an unreasonably long canonicalization process.
     * See the [security consideration section](https://www.w3.org/TR/rdf-canon/#security-considerations) in the specification.
     *
     * The default value set by this implementation is 50; any number _greater_ then this number is ignored (and an exception is thrown).
     */
    set maximum_complexity_number(level: number);
    get maximum_complexity_number(): number;
    /**
     * The system-wide maximum value for the complexity level. The current maximum complexity level cannot exceed this value.
     */
    get maximum_allowed_complexity_number(): number;
    /**
     * Canonicalize a Dataset into an N-Quads document.
     *
     * Implementation of the main algorithm, see the
     * [separate overview in the spec](https://www.w3.org/TR/rdf-canon/#canon-algo-overview).
     *
     * (The real work is done in the [separate function](../functions/lib_canonicalization.computeCanonicalDataset.html)).
     *
     * @remarks
     * Note that the N-Quads parser throws an exception in case of syntax error.
     *
     * @throws - RangeError, if the complexity of the graph goes beyond the set complexity number. See {@link maximum_complexity_number}.
     *
     * @param input_dataset
     * @param copy - whether the input should be copied to a local store (e.g., if the input is a generator, or the uniqueness of quads are not guaranteed). If this
     * parameter is not used (i.e., value is `undefined`) the copy is always done _unless_ the input is an `rdf.DatasetCore` instance.
     * @returns - N-Quads document using the canonical ID-s.
     *
     * @async
     *
     */
    canonicalize(input_dataset: InputDataset, copy?: boolean | undefined): Promise<string>;
    /**
     * Canonicalize a Dataset producing the full set of information.
     *
     * Implementation of the main algorithmic steps, see
     * [separate overview in the spec](https://www.w3.org/TR/rdf-canon/#canon-algo-overview).
     *
     * (The real work is done in the [separate function](../functions/lib_canonicalization.computeCanonicalDataset.html)).
     *
     * The result is an Object containing the serialized version and the Quads version of the canonicalization result,
     * as well as a bnode mapping from the original to the canonical equivalents.
     *
     * @remarks
     * Note that the N-Quads parser throws an exception in case of syntax error.
     *
     * @throws - RangeError, if the complexity of the graph goes beyond the set complexity number. See {@link maximum_complexity_number}.
     *
     * @param input_dataset
     * @param copy - whether the input should be copied to a local store (e.g., if the input is a generator, or the uniqueness of quads are not guaranteed). If this
     * parameter is not used (i.e., value is `undefined`) the copy is always done _unless_ the input is an `rdf.DatasetCore` instance.
     * @returns - Detailed results of the canonicalization
     *
     * @async
     */
    c14n(input_dataset: InputDataset, copy?: boolean | undefined): Promise<C14nResult>;
    /**
     * Serialize a dataset into a (possibly sorted) Array of nquads.
     *
     * @param input_dataset
     * @param sort If `true` (the default) the array is lexicographically sorted
     * @returns
     */
    toNquads(input_dataset: Iterable<rdf.Quad>, sort?: boolean): string[];
    /**
     * Hash a dataset:
     *
     * 1. serialize the dataset into nquads and sort the result (unless the input is an N-Quads document);
     * 2. compute the hash of the concatenated nquads.
     *
     * This method is typically used on the result of the canonicalization to compute the canonical hash of a dataset.
     *
     * @param input_dataset
     * @returns
     */
    hash(input_dataset: InputDataset): Promise<Hash>;
}
