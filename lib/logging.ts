/**
 * Helper functions to make logging more readable.
 * 
 * @copyright Ivan Herman 2023
 * 
 * @packageDocumentation
 */
import { NDegreeHashResult, BNodeToQuads, quadToNquad } from './common';

/**
 * Very simple Logger interface, to be used in the code. Nothing fancy.
 */
export interface LogItem {
    [index: string]: string|string[]|LogItem|LogItem[]|boolean;
}

export interface Logger {
    log: string;
    debug(message: string, ...otherData: LogItem[]): void;
    warn(message: string, ...otherData: LogItem[]): void;
    error(message: string, ...otherData: LogItem[]): void;
    info(message: string, ...otherData: LogItem[]): void;
}

/**
 * A default, no-operation logger instance, used by default.
 */
export class NopLogger implements Logger {
    log: string;
    debug(message: string, ...otherData: LogItem[]): void {};
    warn(message: string, ...otherData: LogItem[]): void {};
    error(message: string, ...otherData: LogItem[]): void {};
    info(message: string, ...otherData: LogItem[]): void {};
}

/**
 * Return a string version of a {@link BNodeToQuads} instance, usable for debug
 * 
 * @param bntq 
 * @returns 
 */
export function bntqToLogItem(bntq: BNodeToQuads): LogItem {
    const bntnq: LogItem = {};
    for (const bn in bntq) {
        bntnq[bn] = bntq[bn].map(quadToNquad);
    }
    return bntnq;
}

/**
 * Return a string version of an {@link NDegreeHashResult} instance, usable for debug
 */
export function ndhrToLogItem(ndhrs: NDegreeHashResult[]): LogItem[] {
    return ndhrs.map((ndhr: NDegreeHashResult): LogItem => {
        return {
            "hash" : ndhr.hash,
            "issuer": ndhr.issuer.toLogItem()
        }
    });
}


