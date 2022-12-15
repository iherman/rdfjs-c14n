import * as rdf from 'rdf-js';
export type Quads = rdf.DatasetCore<rdf.Quad,rdf.Quad> | rdf.Quad[] | Set<rdf.Quad>;
export type Hash  = string;

declare interface Logger {
    debug(message: string, ...otherData: any[]): void;
    warn(message: string, ...otherData: any[]): void;
    error(message: string, ...otherData: any[]): void;
    info(message: string, ...otherData: any[]): void;
}

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
     * Set hash algorithm. The value can be anything that the underlying openssl environment accepts. The default is "sha256".
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
     * 1. Compute a canonical version of the dataset
     * 2. Serialize the dataset into nquads and sort the result
     * 3. Compute the hash of the concatenated nquads.
     * 
     * @param input_dataset 
     * @param algorithm - Hash algorithm to use. the value can be anything that the underlying openssl environment accepts, defaults to sha256.
     * @returns 
     */
     hash(input_dataset: Quads): Hash;
}
