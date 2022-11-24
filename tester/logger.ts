export interface Logger {
    debug(message: string, ...otherData: any[]): void;
    warn(message: string, ...otherData: any[]): void;
    error(message: string, ...otherData: any[]): void;
    info(message: string, ...otherData: any[]): void;
}

export enum Levels {
    error,
    warn,
    info,
    debug
};

export class SimpleLogger implements Logger {
    private level: Levels;

    constructor(level: Levels) {
        this.level = level;
    }

    private emitMessage(mtype: "debug"|"info"|"warn"|"error", msg: string, extras: any[]): void {
        if (extras.length > 0) {
            console[mtype](`[${mtype}] ${msg}`, extras, '\n')
        } else {
            console[mtype](`[${mtype}] ${msg}`, '\n');
        }
    }
    debug(msg: string, ...extras: any[]): void {
        if (this.level >= Levels.debug) this.emitMessage("debug", msg, extras)
    }
    info(msg: string, ...extras: any[]): void {
        if (this.level >= Levels.info) this.emitMessage("info", msg, extras)
    }
    warn(msg: string, ...extras: any[]): void {
        if (this.level >= Levels.warn) this.emitMessage("warn", msg, extras)
    }
    error(msg: string, ...extras: any[]): void {
        if (this.level >= Levels.error) this.emitMessage("error", msg, extras)
    }
}
