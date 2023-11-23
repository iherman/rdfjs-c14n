/**
 * Implementation of the RDF Canonicalization Algorithm, published by the W3C RCH Working Group. 
 * See [specification](https://www.w3.org/TR/rdf-canon/) for the latest official version.
 * 
 * @copyright Ivan Herman 2023
 * 
 * @packageDocumentation
 */

import * as rdf from 'rdf-js';
import * as n3 from 'n3';

import { GlobalState, Quads, hashDataset, Hash, quadsToNquads, InputDataset, computeHash } from './lib/common';
import { AVAILABLE_HASH_ALGORITHMS, DEFAULT_MAXIMUM_COMPLEXITY, ConfigData, GetConfigData, defaultConfigData } from './lib/config';
import { C14nResult } from './lib/common';
import { IDIssuer } from './lib/issueIdentifier';
import { computeCanonicalDataset } from './lib/canonicalization';
import { LoggerFactory, LogLevels, Logger } from './lib/logging';

export { Quads, InputDataset, C14nResult } from './lib/common';
export { Hash, BNodeId } from './lib/common';
export { LogLevels, Logger } from './lib/logging';
export { ConfigData, GetConfigData } from './lib/config';

/**
 * Just a shell around the algorithm, consisting of a state, and the call for the real implementation.
 * 
 * The variable parts of the state, as [defined in the spec](https://www.w3.org/TR/rdf-canon/#dfn-canonicalization-state), 
 * are re-initialized at a call to the canonicalize call. Ie, the same class instance can be reused to
 * {@link RDFC10#canonicalize} for different graphs.
 */
export class RDFC10 {
    private state: GlobalState;
    /**
     * @constructor
     * @param data_factory  An implementation of the generic RDF DataFactory interface, see [the specification](http://rdf.js.org/data-model-spec/#datafactory-interface). If undefined, the DataFactory of the [n3 package](https://www.npmjs.com/package/n3) is used.
     * @param getConfigData A function returning the configuration data, see {@link ConfigData}. By default, this return the constant values set in the code; the caller may provide a more complex function to handle environment variables and/or configuration files
     */
    constructor(data_factory?: rdf.DataFactory, getConfigData?: GetConfigData) {
        const localGetConfigData: GetConfigData =
            (getConfigData !== undefined && getConfigData !== null) ? getConfigData : defaultConfigData;

        const { c14n_complexity, c14n_hash } = localGetConfigData();

        this.state = {
            bnode_to_quads: {},
            hash_to_bnodes: {},
            canonical_issuer: new IDIssuer(),
            hash_algorithm: c14n_hash,
            dataFactory: (data_factory !== null && data_factory !== undefined) ? data_factory : n3.DataFactory,
            logger: LoggerFactory.createLogger(LoggerFactory.DEFAULT_LOGGER),
            logger_id: LoggerFactory.DEFAULT_LOGGER,
            complexity_number: c14n_complexity,
            maximum_n_degree_call: 0,
            current_n_degree_call: 0
        };
    }

    /**
     * Create and set a logger instance
     *  
     * @param logger 
     */
    setLogger(id: string = LoggerFactory.DEFAULT_LOGGER, level: LogLevels = LogLevels.debug): Logger | undefined {
        const new_logger = LoggerFactory.createLogger(id, level);
        if (new_logger !== undefined) {
            this.state.logger_id = id;
            this.state.logger = new_logger;
            return new_logger;
        } else {
            return undefined;
        }
    }

    /**
     * Current logger type
     */
    get logger_type(): string {
        return this.state.logger_id;
    }

    /**
     * List of available logger types.
     */
    get available_logger_types(): string[] {
        return LoggerFactory.loggerTypes();
    }

    /**
     * Set the Hash algorithm. The default is "sha256".
     * If the algorithm is available the value is ignored (and an exception is thrown).
     * 
     * The name is considered to be case insensitive. Also, both the formats including, or not, the '-' characters
     * are accepted (i.e., "sha256" and "sha-256").
     * 
     * @param algorithm_in: the (case insensitive) name of the algorithm, 
     */
    set hash_algorithm(algorithm_in: string) {
        // To avoid stupid case dependent misspellings...
        const algorithm = algorithm_in.toLowerCase();

        if (Object.keys(AVAILABLE_HASH_ALGORITHMS).includes(algorithm)) {
            this.state.hash_algorithm = algorithm;
        } else {
            const error_message = `"${algorithm_in}" is not a valid Hash Algorithm name`;
            throw TypeError(error_message);
        }
    }
    get hash_algorithm(): string {
        return this.state.hash_algorithm;
    }

    /**
     * List of available hash algorithm names.
     */
    get available_hash_algorithms(): string[] {
        return Object.keys(AVAILABLE_HASH_ALGORITHMS);
    }

    /**
     * Set the maximal complexity number. This number, multiplied with the number of blank nodes in the dataset,
     * sets a maximum level of calls the algorithm can do for the so called "hash n degree quads" function.
     * Setting this number to a reasonably low number (say, 30),
     * ensures that some "poison graphs" would not result in an unreasonably long canonicalization process.
     * See the [security consideration section](https://www.w3.org/TR/rdf-canon/#security-considerations) in the specification.
     * 
     * The default value set by this implementation is 50; any number _greater_ then this number is ignored (and an exception is thrown).
     */
    set maximum_complexity_number(level: number) {
        if (!Number.isNaN(level) && Number.isInteger(level) && level > 0 && level < DEFAULT_MAXIMUM_COMPLEXITY) {
            this.state.complexity_number = level;
        } else {
            const error_message = `Required complexity must be between 0 and ${DEFAULT_MAXIMUM_COMPLEXITY}`;
            throw RangeError(error_message);
        }
    }
    get maximum_complexity_number(): number {
        return this.state.complexity_number;
    }

    /**
     * The system-wide maximum value for the recursion level. The current maximum recursion level cannot exceed this value.
     */
    get maximum_allowed_complexity_number(): number {
        return DEFAULT_MAXIMUM_COMPLEXITY;
    }

    /**
     * Canonicalize a Dataset into an N-Quads document.
     * 
     * Implementation of the main algorithmic steps, see
     * [separate overview in the spec](https://www.w3.org/TR/rdf-canon/#canon-algo-overview). 
     * 
     * (The real work is done in the [separate function](../functions/lib_canonicalization.computeCanonicalDataset.html)).
     * 
     * @remarks
     * Note that the N-Quads parser throws an exception in case of syntax error.
     * 
     * @throws - RangeError, if the complexity of the graph goes beyond the set complexity number. See {@link maximum_complexity_number}
     * 
     * @param input_dataset 
     * @returns - N-Quads document using the canonical ID-s.
     * 
     * @async
     * 
     */
    async canonicalize(input_dataset: InputDataset): Promise<string> {
        return (await this.c14n(input_dataset)).canonical_form;
    }

    /**
     * Canonicalize a Dataset producing the full set of information.
     * 
     * Implementation of the main algorithmic steps, see
     * [separate overview in the spec](https://www.w3.org/TR/rdf-canon/#canon-algo-overview). 
     * 
     * (The real work is done in the [separate function](../functions/lib_canonicalization.computeCanonicalDataset.html)).
     * 
     * The result is an Object containing the serialized version and the Quads version of the canonicalization result, 
     * as well as a bnode mapping from the original to the canonical equivalents
     * 
     * @remarks
     * Note that the N-Quads parser throws an exception in case of syntax error.
     * 
     * @throws - RangeError, if the complexity of the graph goes beyond the set complexity number. See {@link maximum_complexity_number}
     *
     * @param input_dataset 
     * @returns - Detailed results of the canonicalization
     * 
     * @async
     */
    async c14n(input_dataset: InputDataset): Promise<C14nResult> {
        return computeCanonicalDataset(this.state, input_dataset);
    }

    /**
     * Serialize a dataset into a (possibly sorted) Array of nquads.
     * 
     * @param input_dataset 
     * @param sort If `true` (the default) the array is lexicographically sorted
     * @returns 
     */
    toNquads(input_dataset: Quads, sort: boolean = true): string[] {
        return quadsToNquads(input_dataset, sort);
    }

    /**
     * Hash a dataset:
     * 
     * 1. Serialize the dataset into nquads and sort the result (unless the input is an N-Quads document)
     * 2. Compute the hash of the concatenated nquads.
     * 
     * This method is typically used on the result of the canonicalization to compute the canonical hash of a dataset.
     * 
     * @param input_dataset 
     * @returns
     */
    async hash(input_dataset: InputDataset): Promise<Hash> {
        if (typeof input_dataset === 'string') {
            return computeHash(this.state, input_dataset);
        } else {
            return hashDataset(this.state, input_dataset, true);
        }
    }
}
