import * as rdf from 'rdf-js';
export type Graph = Set<rdf.Quad>;
export type QuadToNquad = (quad: rdf.Quad) => string;

export interface Logger {
    debug(message: string, ...otherData: any[]): void;
    warn(message: string, ...otherData: any[]): void;
    error(message: string, ...otherData: any[]): void;
    info(message: string, ...otherData: any[]): void;
}

export class NopLogger implements Logger {
    debug(message: string, ...otherData: any[]): void {};
    warn(message: string, ...otherData: any[]): void {};
    error(message: string, ...otherData: any[]): void {};
    info(message: string, ...otherData: any[]): void {};
}

export class URDNA2015 {
    /**
     * 
     * @param data_factory  An implementation of the generic RDF DataFactory interface, see http://rdf.js.org/data-model-spec/#datafactory-interface
     * @param quad_to_nquad A function that converts an rdf.Quad into a bona fide nquad string
     * @param logger        A logger instance; defaults to an "empty" logger, ie, no logging happens
     */
    constructor(data_factory: rdf.DataFactory, quad_to_nquad: QuadToNquad, logger: Logger);

    /**
     * Implementation of the main algorithmic steps
     * 
     * @param input_dataset 
     * @returns 
     */
    canonicalize(input_dataset: Graph): Graph;
}
