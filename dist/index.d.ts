import * as rdf from 'rdf-js';
export type Dataset     = rdf.DatasetCore<rdf.Quad,rdf.Quad> | rdf.Quad[] | Set<rdf.Quad>;
export type Hash        = string;

declare interface Logger {
    debug(message: string, ...otherData: any[]): void;
    warn(message: string, ...otherData: any[]): void;
    error(message: string, ...otherData: any[]): void;
    info(message: string, ...otherData: any[]): void;
}

declare function hash_dataset(quads: Dataset, sort: boolean, algorithm?: string): Hash;

declare class RDFCanon {
    /**
     * 
     * @param data_factory    An implementation of the generic RDF DataFactory interface, see http://rdf.js.org/data-model-spec/#datafactory-interface
     * @param dataset_factory An implementation of the generic RDF DatasetCoreFactory interface, see https://rdf.js.org/dataset-spec/#datasetcorefactory-interface
     * @param logger          A logger instance; defaults to an "empty" logger, ie, no logging happens
     */
    constructor(data_factory: rdf.DataFactory, dataset_factory: rdf.DatasetCoreFactory, logger: Logger);

    /**
     * Implementation of the main algorithmic steps
     * 
     * @param input_dataset 
     * @returns 
     */
    canonicalize(input_dataset: Dataset): Dataset;

    /**
     * Hash a dataset:
     * 
     * 1. Compute a canonical version of the dataset
     * 2. Serialize the dataset into nquads and sort the result
     * 3. Compute the hash of the concatenated nquads.
     * 
     * @param input_dataset 
     * @param algorithm - Hash algorithm to use. the value can be anything that the underlying openssl environment accepts, defaults to sha256.
     * @returns 
     */
     hash(input_dataset: Dataset, algorithm: string): Hash;
}
