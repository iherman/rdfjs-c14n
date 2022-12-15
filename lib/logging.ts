/**
 * Helper functions to make logging more readable.
 * 
 * @copyright Ivan Herman 2023
 * 
 * @packageDocumentation
 */
import { BNodeId, NDegreeHashResult, BNodeToQuads, quadToNquad } from './common';

/**
 * Very simple Logger interface, to be used in the code. Nothing fancy.
 */
export interface Logger {
    debug(message: string, ...otherData: any[]): void;
    warn(message: string, ...otherData: any[]): void;
    error(message: string, ...otherData: any[]): void;
    info(message: string, ...otherData: any[]): void;
}

/**
 * A default, no-operation logger instance, used by default.
 */
export class NopLogger implements Logger {
    debug(message: string, ...otherData: any[]): void {};
    warn(message: string, ...otherData: any[]): void {};
    error(message: string, ...otherData: any[]): void {};
    info(message: string, ...otherData: any[]): void {};
}

interface BNodeToNQuads {
    [index: BNodeId] : string[];
}
/**
 * Return a string version of a {@link BNodeToQuads} instance, usable for debug
 * 
 * @param bntq 
 * @returns 
 */
export function bntqToString(bntq: BNodeToQuads): string {
    const bntnq: BNodeToNQuads = {};
    for (const bn in bntq) {
        bntnq[bn] = bntq[bn].map(quadToNquad);
    }
    return `${JSON.stringify(bntnq,null,4)}`;
}

/**
 * Return a string version of an {@link NDegreeHashResult} instance, usable for debug
 */
export function ndhrToString(ndhrs: NDegreeHashResult[]): string {
    return ndhrs.map((ndhr: NDegreeHashResult): string => `Hash: "${ndhr.hash}"${ndhr.issuer.toString()}`).join(',\n')
}


