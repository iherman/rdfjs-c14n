/**
 * Logging environment, used by the rest of the code. By default, no logging occurs; the user can set his/her own
 * logging environment. This module also includes a logger to create a recursive log in YAML.
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
 * And individual log item.
 */
export interface LogItem {
    [index: string]: string|string[]|Map<string,string>|boolean|LogItem|LogItem[];
}

export type Log = Map<string,LogItem>;

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
export interface Logger {
    /** The current log */
    log_object: LogItem;

    /** The current log, in some string representation */
    log: string;

    /**
     * Debug level log.
     * 
     * @param log_point 
     * @param position 
     * @param otherData 
     */
    debug(log_point: string, position: string, ...otherData: LogItem[]): void;

    /**
     * Warning level log.
     * 
     * @param log_point 
     * @param position 
     * @param otherData 
     */
    warn(log_point: string, position: string, ...otherData: LogItem[]): void;

    /**
     * Error level log.
     * 
     * @param log_point 
     * @param position 
     * @param otherData 
     */
    error(log_point: string, position: string, ...otherData: LogItem[]): void;

    /**
     * Information level log.
     * 
     * @param log_point 
     * @param position 
     * @param otherData 
     */
    info(log_point: string, position: string, ...otherData: LogItem[]): void;

    /**
     * Entry point for recursive call. This is issued at each function entry except the top level, and at some, more complex cycles.
     * Needed if the logger instance intends to create recursive logs.
     * @param label - identification of the position in the code
     * @param position
     */
    push(label: string, position ?: string, ...otherData: LogItem[]): void;

    /**
     * Counterpart of the {@link push} method.
     */
    pop(): void;
}

/**
 * A default, no-operation logger instance, used by default. All methods are empty, ie, all messages are lost...
 */
export class NopLogger implements Logger {
    log: string = '';
    log_object: LogItem = {};
    debug(log_point: string, position: string, ...otherData: LogItem[]): void {};
    warn(log_point: string, position: string, ...otherData: LogItem[]): void {};
    error(log_point: string, position: string, ...otherData: LogItem[]): void {};
    info(log_point: string, position: string, ...otherData: LogItem[]): void {};
    push(label: string, position ?: string, ...otherData: LogItem[]): void {};
    pop(): void {};
}


/**
 * Simple logger, storing the individual log messages as an array of {@link LogItem} objects. The logger
 * follows the recommendations on severity levels as described in {@link Logger}.
 * 
 * The final log can be retrieved either as the array of Objects via the `log_object`, or
 * as a YAML string via the `log` attributes, respectively.
 * 
 * By default, the logger level is set to `LogLevels.info`.
 */
export class YamlLogger implements Logger {
    private level: LogLevels;

    private top_log: LogItem = {};
    private current_log: LogItem[];
    private log_stack: LogItem[][] = [];


    constructor(level: LogLevels = LogLevels.info) {
        this.level = level;

        const ca_level: LogItem[] = [];
        this.top_log["ca"] = ca_level;
        this.current_log = ca_level;
    }

    private emitMessage(mtype: "debug"|"info"|"warn"|"error", log_id: string, position: string, extras: LogItem[]): void {
        const item: LogItem = {};
        if (position !== '') {
            item["log point"] = mtype === "info" ? `${position}` : `[${mtype}] ${position}`;
        }
        if (extras.length !== 0) {
            item["with"] = extras;
        }

        const full_item: LogItem = {};
        full_item[log_id] = item;
        this.current_log.push(full_item);
    }

    debug(log_id: string, position: string, ...extras: LogItem[]): void {
        if (this.level >= LogLevels.debug) this.emitMessage("debug", log_id, position, extras)
    }
    info(log_id: string, position: string, ...extras: LogItem[]): void {
        if (this.level >= LogLevels.info) this.emitMessage("info", log_id, position, extras)
    }
    warn(log_id: string, position: string, ...extras: LogItem[]): void {
        if (this.level >= LogLevels.warn) this.emitMessage("warn", log_id, position, extras)
    }
    error(log_id: string, position: string, ...extras: LogItem[]): void {
        if (this.level >= LogLevels.error) this.emitMessage("error", log_id, position, extras)
    }

    push(label: string, position ?: string, ...extras: LogItem[]): void {
        const new_level: LogItem[] = [];
        const new_level_ref: LogItem = {};

        new_level_ref[label] = new_level;
        if (position && position !== "") {
            new_level.push({
                "push on stack": position
            })
        }
        if (extras.length !== 0) {
            new_level.push({
                "with": extras
            });
        }

        this.current_log.push(new_level_ref);

        this.log_stack.push(this.current_log);
        this.current_log = new_level;
    }

    pop(): void {
        this.current_log = this.log_stack.pop();
    }

    get log_object(): LogItem {
        return this.top_log;
    }

    get log(): string {
        return yaml.stringify(this.log_object, { aliasDuplicateObjects: false });
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

