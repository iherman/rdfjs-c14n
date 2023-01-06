/**
 * Simple logging environment, used by the rest of the code. By default, no logging occurs; the user can set his/her own
 * logging environment. This module also includes a logger to dump the results into a YAML file.
 * 
 * @copyright Ivan Herman 2023
 * 
 * @packageDocumentation
 */
import * as yaml from 'yaml';
import { NDegreeHashResult, BNodeToQuads, quadToNquad, HashToBNodes, Hash } from './common';

/** 
 * Logging severity levels (following the usual practice, although the full hierarchy is not used) 
 * @enum
 */
export enum LogLevels {
    error,
    warn,
    info,
    debug
};

/**
 * And individual log item. A complete log is, conceptually, an array of such log reports.
 */
export interface LogItem {
    [index: string]: string|string[]|LogItem|LogItem[]|boolean;
}

/**
 * Very simple Logger interface, to be used in the code. 
 * 
 * Implementations should follow the usual interpretation of log severity levels. E.g., if 
 * the Logger is set up with severity level of, say, `LogLevels.info`, then the messages to `debug` should be ignored. If the 
 * level is set to `LogLevels.warn`, then only warning and debugging messages should be recorded/displayed, etc.
 * 
 */
export interface Logger {
    log: string;
    debug(message: string, ...otherData: LogItem[]): void;
    warn(message: string, ...otherData: LogItem[]): void;
    error(message: string, ...otherData: LogItem[]): void;
    info(message: string, ...otherData: LogItem[]): void;
}

/**
 * A default, no-operation logger instance, used by default. All messages are lost
 */
export class NopLogger implements Logger {
    log: string = '';
    debug(message: string, ...otherData: LogItem[]): void {};
    warn(message: string, ...otherData: LogItem[]): void {};
    error(message: string, ...otherData: LogItem[]): void {};
    info(message: string, ...otherData: LogItem[]): void {};
}


/**
 * Simple logger, storing the individual log messages as an array of {@link LogItem} objects. The logger
 * follows the recommendations on severity levels as described in {@link Logger}.
 * 
 * The final log can be retrieved either as the array of Objects via the `logObject`, or
 * as a YAML string via the `log` attributes, respectively.
 * 
 * By default, the logger level is set to `LogLevels.info`.
 */
export class YamlLogger implements Logger {
    private level: LogLevels;
    private theLog: LogItem[];

    constructor(level: LogLevels = LogLevels.info) {
        this.level = level;
        this.theLog = [];
    }

    private emitMessage(mtype: "debug"|"info"|"warn"|"error", msg: string, extras: LogItem[]): void {
        const item: LogItem = {
            "log point" : mtype === "info" ? `${msg}` : `[${mtype}] ${msg}`
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

    get logObject(): LogItem[] {
        return this.theLog
    }

    get log(): string {
        return yaml.stringify(this.theLog);
    }
}

/**
 * Return a log item version of a `BNodeToQuads` instance, used to build up a full log message.
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
 * Return a log item version of an `NDegreeHashResult` instance, used to build up a full log message.
 * 
 * @param ndhrs 
 * @returns 
 */
export function ndhrToLogItem(ndhrs: NDegreeHashResult[]): LogItem[] {
    return ndhrs.map((ndhr: NDegreeHashResult): LogItem => {
        return {
            "hash" : ndhr.hash,
            "issuer": ndhr.issuer.toLogItem()
        }
    });
}

/**
 * Return a log item version of an `HashToBNodes` instance, used to build up a full log message.
 * 
 * @param htbn 
 * @returns 
 */
export function htbnToLogItem(htbn: HashToBNodes): LogItem[] {
    return Object.keys(htbn).map((index: Hash): LogItem => {
        return {
            "hash": index,
            "bnodes": htbn[index]
        }
    });
}

