/**
 * Simple logging environment, used by the rest of the code. By default, no logging occurs; the user can set his/her own
 * logging environment. This module also includes a logger to dump the results into a YAML file.
 * 
 * @copyright Ivan Herman 2023
 * 
 * @packageDocumentation
 */
import * as yaml from 'yaml';
import { NDegreeHashResult, BNodeToQuads, quadToNquad } from './common';

/** Logging levels (following the usual practice) */
export enum LogLevels {
    error,
    warn,
    info,
    debug
};

/**
 * And individual log item when logging
 */
export interface LogItem {
    [index: string]: string|string[]|LogItem|LogItem[]|boolean;
}

/**
 * Very simple Logger interface, to be used in the code. Nothing fancy.
 */
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
 * Simple logger, producing a YAML output of the log entries. This final log can be retrieved by
 * using the `log` variable.
 */
export class SimpleYamlLogger implements Logger {
    private level: LogLevels;
    private theLog: LogItem[];

    constructor(level: LogLevels) {
        this.level = level;
        this.theLog = [];
    }

    private emitMessage(mtype: "debug"|"info"|"warn"|"error", msg: string, extras: LogItem[]): void {
        const item: LogItem = {
            "log point" : `[${mtype}] ${msg}`
        }
        if (extras.length > 0) {
            item["with"] = extras;
        }
        this.theLog.push(item);
    }

    debug(msg: string, ...extras: LogItem[]): void {
        if (this.level >= LogLevels.debug) this.emitMessage("debug", msg, extras)
    }
    info(msg: string, ...extras: LogItem[]): void {
        if (this.level >= LogLevels.info) this.emitMessage("info", msg, extras)
    }
    warn(msg: string, ...extras: LogItem[]): void {
        if (this.level >= LogLevels.warn) this.emitMessage("warn", msg, extras)
    }
    error(msg: string, ...extras: LogItem[]): void {
        if (this.level >= LogLevels.error) this.emitMessage("error", msg, extras)
    }

    get log(): string {
        return yaml.stringify(this.theLog);
    }
}

/**
 * Return a log item version of a {@link BNodeToQuads} instance, used to build up a full log message.
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
 * Return a log item version of an {@link NDegreeHashResult} instance, used to build up a full log message.
 */
export function ndhrToLogItem(ndhrs: NDegreeHashResult[]): LogItem[] {
    return ndhrs.map((ndhr: NDegreeHashResult): LogItem => {
        return {
            "hash" : ndhr.hash,
            "issuer": ndhr.issuer.toLogItem()
        }
    });
}


