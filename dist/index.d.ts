import * as rdf from 'rdf-js';
export type Quads = rdf.DatasetCore<rdf.Quad,rdf.Quad> | rdf.Quad[] | Set<rdf.Quad>;
export type Hash  = string;

/*********************************************************
The main class encapsulating the library's functionalities
**********************************************************/

declare function quadsToNquads(quads: Iterable<rdf.Quad>, sort?: boolean): string[];

declare class RDFCanon {
    /**
     * 
     * @param data_factory    An implementation of the generic RDF DataFactory interface, see http://rdf.js.org/data-model-spec/#datafactory-interface
     * @param dataset_factory An implementation of the generic RDF DatasetCoreFactory interface, see https://rdf.js.org/dataset-spec/#datasetcorefactory-interface. If undefined, the canonicalized graph will automatically be a Set of quads.
     */
    constructor(data_factory: rdf.DataFactory, dataset_factory?: rdf.DatasetCoreFactory);

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
    [index: string]: string|string[]|LogItem|LogItem[]|boolean;
}

declare interface Logger {
    log: string;
    debug(message: string, ...otherData: LogItem[]): void;
    warn(message: string, ...otherData: LogItem[]): void;
    error(message: string, ...otherData: LogItem[]): void;
    info(message: string, ...otherData: LogItem[]): void;
}

declare class YamlLogger implements Logger {
    log: string;
    constructor(level?: LogLevels);
    debug(message: string, ...otherData: LogItem[]): void;
    warn(message: string, ...otherData: LogItem[]): void;
    error(message: string, ...otherData: LogItem[]): void;
    info(message: string, ...otherData: LogItem[]): void;
}
