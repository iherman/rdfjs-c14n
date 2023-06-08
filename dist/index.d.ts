import * as rdf from 'rdf-js';

export type Quads        = rdf.Quad[] | Set<rdf.Quad>;
export type InputDataset = Quads | string;
export type BNodeId      = string;
export type Hash         = string;

declare interface C14nResult {
    dataset       : Quads;
    dataset_nquad : string;
    bnode_id_map  : Map<BNodeId,BNodeId>;
}

/*********************************************************
The main class encapsulating the library's functionalities
**********************************************************/

declare class RDFC10 {
    /**
     * @constructor
     * @param data_factory  An implementation of the generic RDF DataFactory interface, see [the specification](http://rdf.js.org/data-model-spec/#datafactory-interface). If undefined, the DataFactory of the [`n3` package](https://www.npmjs.com/package/n3) is used.
     */
    constructor(data_factory?: rdf.DataFactory);

    /**
     * Set a logger instance. By default it is an "empty" logger, ie, no logging happens
     * @param logger 
     */
    setLogger(logger: Logger): void;

    /**
     * Set the hash algorithm. The value can be anything that the underlying openssl, as used by node.js, accepts. The default is "sha256".
     */
    setHashAlgorithm(algorithm: string): void;

    /**
     * Canonicalize a Dataset into an N-Quads document.
     * 
     * Implementation of the main algorithmic steps, see
     * [separate overview in the spec](https://www.w3.org/TR/rdf-canon/#canon-algo-overview). The
     * real work is done in the [separate function](../functions/lib_canonicalization.computeCanonicalDataset.html).
     * 
     * @param input_dataset 
     * @returns - N-Quads document using the canonical ID-s.
     */
    canonicalize(input_dataset: InputDataset): string;

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
     * @param input_dataset 
     * @returns - Detailed results of the canonicalization
     */
    canonicalizeDetailed(input_dataset: InputDataset): C14nResult ; 

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
     */
    hash(input_dataset: InputDataset): Hash;
}

declare class RDFCanon extends RDFC10 {};

/*****************************************************************************
Type and class declarations for logging; can be ignored if no logging is used
******************************************************************************/
declare enum LogLevels {
    error,
    warn,
    info,
    debug
}

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
    log: string;
    log_object: LogItem;
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
}

declare class YamlLogger implements Logger {
    log: string;
    log_object: LogItem;
    constructor(level?: LogLevels);
    debug(log_point: string, position: string, ...otherData: LogItem[]): void;
    warn(log_point: string, position: string, ...otherData: LogItem[]): void;
    error(log_point: string, position: string, ...otherData: LogItem[]): void;
    info(log_point: string, position: string, ...otherData: LogItem[]): void;
    push(label: string, extra_info ?: string, ...otherData: LogItem[]): void;
    pop(): void;
}
