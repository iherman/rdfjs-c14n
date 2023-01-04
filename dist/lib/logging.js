"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ndhrToLogItem = exports.bntqToLogItem = exports.SimpleYamlLogger = exports.NopLogger = exports.LogLevels = void 0;
/**
 * Simple logging environment, used by the rest of the code. By default, no logging occurs; the user can set his/her own
 * logging environment. This module also includes a logger to dump the results into a YAML file.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
const yaml = require("yaml");
const common_1 = require("./common");
/** Logging levels (following the usual practice) */
var LogLevels;
(function (LogLevels) {
    LogLevels[LogLevels["error"] = 0] = "error";
    LogLevels[LogLevels["warn"] = 1] = "warn";
    LogLevels[LogLevels["info"] = 2] = "info";
    LogLevels[LogLevels["debug"] = 3] = "debug";
})(LogLevels = exports.LogLevels || (exports.LogLevels = {}));
;
/**
 * A default, no-operation logger instance, used by default.
 */
class NopLogger {
    log;
    debug(message, ...otherData) { }
    ;
    warn(message, ...otherData) { }
    ;
    error(message, ...otherData) { }
    ;
    info(message, ...otherData) { }
    ;
}
exports.NopLogger = NopLogger;
/**
 * Simple logger, producing a YAML output of the log entries. This final log can be retrieved by
 * using the `log` variable.
 */
class SimpleYamlLogger {
    level;
    theLog;
    constructor(level) {
        this.level = level;
        this.theLog = [];
    }
    emitMessage(mtype, msg, extras) {
        const item = {
            "log point": `[${mtype}] ${msg}`
        };
        if (extras.length > 0) {
            item["with"] = extras;
        }
        this.theLog.push(item);
    }
    debug(msg, ...extras) {
        if (this.level >= LogLevels.debug)
            this.emitMessage("debug", msg, extras);
    }
    info(msg, ...extras) {
        if (this.level >= LogLevels.info)
            this.emitMessage("info", msg, extras);
    }
    warn(msg, ...extras) {
        if (this.level >= LogLevels.warn)
            this.emitMessage("warn", msg, extras);
    }
    error(msg, ...extras) {
        if (this.level >= LogLevels.error)
            this.emitMessage("error", msg, extras);
    }
    get log() {
        return yaml.stringify(this.theLog);
    }
}
exports.SimpleYamlLogger = SimpleYamlLogger;
/**
 * Return a log item version of a {@link BNodeToQuads} instance, used to build up a full log message.
 *
 * @param bntq
 * @returns
 */
function bntqToLogItem(bntq) {
    const bntnq = {};
    for (const bn in bntq) {
        bntnq[bn] = bntq[bn].map(common_1.quadToNquad);
    }
    return bntnq;
}
exports.bntqToLogItem = bntqToLogItem;
/**
 * Return a log item version of an {@link NDegreeHashResult} instance, used to build up a full log message.
 */
function ndhrToLogItem(ndhrs) {
    return ndhrs.map((ndhr) => {
        return {
            "hash": ndhr.hash,
            "issuer": ndhr.issuer.toLogItem()
        };
    });
}
exports.ndhrToLogItem = ndhrToLogItem;
