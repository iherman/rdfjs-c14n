/**
 * Implementation of a logger producing a YAML output of the log items
 */


import * as yaml from 'yaml';

interface LogItem {
    [index: string]: string|string[]|LogItem|LogItem[]|boolean;
}

export interface Logger {
    log: string;
    debug(message: string, ...otherData: LogItem[]): void;
    warn(message: string, ...otherData: LogItem[]): void;
    error(message: string, ...otherData: LogItem[]): void;
    info(message: string, ...otherData: LogItem[]): void;
}

export enum Levels {
    error,
    warn,
    info,
    debug
};

export class SimpleLogger implements Logger {
    private level: Levels;
    private theLog: LogItem[];

    constructor(level: Levels) {
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
        if (this.level >= Levels.debug) this.emitMessage("debug", msg, extras)
    }
    info(msg: string, ...extras: LogItem[]): void {
        if (this.level >= Levels.info) this.emitMessage("info", msg, extras)
    }
    warn(msg: string, ...extras: LogItem[]): void {
        if (this.level >= Levels.warn) this.emitMessage("warn", msg, extras)
    }
    error(msg: string, ...extras: LogItem[]): void {
        if (this.level >= Levels.error) this.emitMessage("error", msg, extras)
    }

    get log(): string {
        return yaml.stringify(this.theLog);
    }
}
