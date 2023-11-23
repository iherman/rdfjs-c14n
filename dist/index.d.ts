import * as rdf from 'rdf-js';

export type Quads        = rdf.Quad[] | Set<rdf.Quad>;
export type InputDataset = Quads | string;
export type BNodeId      = string;
export type Hash         = string;

declare interface ConfigData {
    /** Number must be positive */
    c14n_complexity?: number,

    /** The value must be one of the algorithms listed in the built-in list of available hash functions */
    c14n_hash?: string,
}

export type GetConfigData = () => ConfigData;

declare interface C14nResult {
    /** N-Quads serialization of the dataset */
    canonical_form        : string;

    /** Dataset as Set or Array of rdf Quads */
    canonicalized_dataset : Quads;

    /** Mapping of a blank node to its identifier */
    bnode_identifier_map  : ReadonlyMap<rdf.BlankNode,BNodeId>;

    /** Mapping of an (original) blank node id to its canonical equivalent */
    issued_identifier_map : ReadonlyMap<BNodeId,BNodeId>;
} 

declare enum LogLevels {
    error,
    warn,
    info,
    debug
}

/*********************************************************
The main class encapsulating the library's functionalities
**********************************************************/

declare class RDFC10 {
    /**
     * @constructor
     * @param data_factory  An implementation of the generic RDF DataFactory interface, see [the specification](http://rdf.js.org/data-model-spec/#datafactory-interface). If undefined, the DataFactory of the [`n3` package](https://www.npmjs.com/package/n3) is used.
     * @param getConfigData A function returning the configuration data, see {@link ConfigData}. By default, this return the constant values set in the code; the caller may provide a more complex function to handle environment variables and/or configuration files
     */
    constructor(data_factory?: rdf.DataFactory, getConfigData?: GetConfigData);

    /**
     * Set a logger instance. By default it is an "empty" logger, ie, no logging happens
     * @param logger 
     */
    setLogger(id: string, level: LogLevels);

    /**
     * Current logger type
     */
    get logger_type(): string;

    /**
     * List of available logger types.
     */
    get available_logger_types(): string[];


    /**
    * Set the Hash algorithm. The default is "sha256".
    * If the algorithm is available the value is ignored (and an exception is thrown).
    * 
    * The name is considered to be case insensitive. Also, both the formats including, or not, the '-' characters
    * are accepted (i.e., "sha256" and "sha-256").
    * 
    * @param algorithm_in: the (case insensitive) name of the algorithm, 
    */
    set hash_algorithm(algorithm: string);
    get hash_algorithm(): string;
    get available_hash_algorithms(): string[]

    /**
     * Set the maximal complexity number. This number, multiplied with the number of blank nodes in the dataset,
     * sets a maximum level of calls the algorithm can do for the so called "hash n degree quads" function.
     * Setting this number to a reasonably low number (say, 30),
     * ensures that some "poison graphs" would not result in an unreasonably long canonicalization process.
     * See the [security consideration section](https://www.w3.org/TR/rdf-canon/#security-considerations) in the specification.
     * 
     * The default value set by this implementation is 50; any number _greater_ then this number is ignored (and an exception is thrown).
     */
    set maximum_complexity_number(level: number);
    get maximum_complexity_number(): number;
    get maximum_allowed_complexity_number(): number

    /**
     * Canonicalize a Dataset into an N-Quads document.
     * 
     * Implementation of the main algorithmic steps, see
     * [separate overview in the spec](https://www.w3.org/TR/rdf-canon/#canon-algo-overview). The
     * real work is done in the [separate function](../functions/lib_canonicalization.computeCanonicalDataset.html).
     * 
     * @remarks
     * Note that the N-Quads parser throws an exception in case of syntax error.
     * @throws - RangeError, if the complexity of the graph goes beyond the set complexity number. See {@link maximum_complexity_number}
     * 
     * 
     * @param input_dataset 
     * @returns - N-Quads document using the canonical ID-s.
     * @async
     */
    canonicalize(input_dataset: InputDataset): Promise<string>;

    /**
     * Canonicalize a Dataset into a full set of information.
     * 
     * Implementation of the main algorithmic steps, see
     * [separate overview in the spec](https://www.w3.org/TR/rdf-canon/#canon-algo-overview). The
     * real work is done in the [separate function](../functions/lib_canonicalization.computeCanonicalDataset.html).
     * 
     * The result is an Object containing the serialized version and the Quads version of the canonicalization result, 
     * as well as a bnode mapping from the original to the canonical equivalents
     * 
     * @remarks
     * Note that the N-Quads parser throws an exception in case of syntax error.
     * @throws - RangeError, if the complexity of the graph goes beyond the set complexity number. See {@link maximum_complexity_number}
     * 
     * @param input_dataset 
     * @returns - Detailed results of the canonicalization
     * @async
     */
    c14n(input_dataset: InputDataset): Promise<C14nResult> ; 

    /**
     * Serialize the dataset into a (possibly sorted) Array of nquads.
     * 
     * @param input_dataset 
     * @param sort If `true` (the default) the array is lexicographically sorted
     * @returns 
     */
    toNquads(input_dataset: Quads, sort?: boolean): string[];

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
     * @async
     */
    hash(input_dataset: InputDataset): Promise<Hash>;
}

/*****************************************************************************
Type and class declarations for logging; can be ignored if no logging is used
******************************************************************************/

declare interface LogItem {
    [index: string]: string|string[]|Map<string,string>|boolean|LogItem|LogItem[];
}

/**
 * Very simple Logger interface, to be used in the code. 
 * 
 * Implementations should follow the usual interpretation of log severity levels. E.g., if 
 * the Logger is set up with severity level of, say, `LogLevels.info`, then the messages to `debug` should be ignored. If the 
 * level is set to `LogLevels.warn`, then only warning and debugging messages should be recorded/displayed, etc.
 * 
 * For each call the arguments are:
 * - log_point: the identification of the log point, related to the spec (in practice, this should be identical to the `id` value of the respective HTML element)
 * - position: short description of the position of the log. The string may be empty (i.e., ""), in which case it will be ignored.
 * - otherData: the 'real' log information
 * 
 */
declare interface Logger {
    level: LogLevels;

    debug(log_point: string, position: string, ...otherData: LogItem[]): void;
    warn(log_point: string, position: string, ...otherData: LogItem[]): void;
    error(log_point: string, position: string, ...otherData: LogItem[]): void;
    info(log_point: string, position: string, ...otherData: LogItem[]): void;
    /**
     * Entry point for a increase in stack level. This is issued at each function entry except the top level, and at some, more complex, cycles.
     * Needed if the logger instance intends to create recursive logs or if the structure is complex.
     * @param label - identification of the position in the code
     * @param extra_info - possible extra information on the level increase 
     * @param 
     */
    push(label: string, extra_info ?: string, ...otherData: LogItem[]): void;

    /**
     * Counterpart of the {@link push} method.
     */
    pop(): void;

    /**
     * Accessor to the (readonly) log;
     */
    get log(): string;
}

