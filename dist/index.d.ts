import * as rdf from 'rdf-js';
export type Dataset     = rdf.DatasetCore<rdf.Quad,rdf.Quad>;

export interface Logger {
    debug(message: string, ...otherData: any[]): void;
    warn(message: string, ...otherData: any[]): void;
    error(message: string, ...otherData: any[]): void;
    info(message: string, ...otherData: any[]): void;
}

export class URDNA2015 {
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
}
