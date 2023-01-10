import * as rdf from 'rdf-js';
export type Quads = rdf.DatasetCore<rdf.Quad,rdf.Quad> | rdf.Quad[] | Set<rdf.Quad>;
export type Hash  = string;

/*********************************************************
The main class encapsulating the library's functionalities
**********************************************************/

declare class RDFCanon {
    /**
     * @constructor
     * @param data_factory  An implementation of the generic RDF DataFactory interface, see [the specification](http://rdf.js.org/data-model-spec/#datafactory-interface). If undefined, the DataFactory of the [`n3` pacakge](https://www.npmjs.com/package/n3) is used.
     * @param dataset_factory An implementation of the generic RDF DatasetCoreFactory interface, see [the specification](https://rdf.js.org/dataset-spec/#datasetcorefactory-interface). If undefined, the canonicalized graph will automatically be a Set of quads.
     */
    constructor(data_factory?: rdf.DataFactory, dataset_factory?: rdf.DatasetCoreFactory);

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
     * Implementation of the main algorithmic steps
     * 
     * @param input_dataset 
     * @returns - the exact type of the output depends on the type of the input dataset. If the input is a Set or an Array, so will be the return. If it is a Dataset, and the dataset_factory has been set set, it will be a Dataset, otherwise a Set.
     */
    canonicalize(input_dataset: Quads): Quads;

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
     * 1. Serialize the dataset into nquads and sort the result
     * 2. Compute the hash of the concatenated nquads.
     * 
     * This method is typically used on the result of the canonicalization to compute the canonical hash of a dataset.
     * 
     * @param input_dataset 
     * @returns 
     */
     hash(input_dataset: Quads): Hash;
}


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
 * - position: short description of the position of the log
 * - otherData: the 'real' log information
 * 
 */
declare interface Logger {
    log: string;
    debug(log_point: string, position: string, ...otherData: LogItem[]): void;
    warn(log_point: string, position: string, ...otherData: LogItem[]): void;
    error(log_point: string, position: string, ...otherData: LogItem[]): void;
    info(log_point: string, position: string, ...otherData: LogItem[]): void;
}

declare class YamlLogger implements Logger {
    log: string;
    constructor(level?: LogLevels);
    debug(log_point: string, position: string, ...otherData: LogItem[]): void;
    warn(log_point: string, position: string, ...otherData: LogItem[]): void;
    error(log_point: string, position: string, ...otherData: LogItem[]): void;
    info(log_point: string, position: string, ...otherData: LogItem[]): void;
}
