"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ndhrToLogItem = exports.bntqToLogItem = exports.YamlLogger = exports.NopLogger = exports.LogLevels = void 0;
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
/**
 * Logging severity levels (following the usual practice, although the full hierarchy is not used)
 * @enum
 */
var LogLevels;
(function (LogLevels) {
    LogLevels[LogLevels["error"] = 0] = "error";
    LogLevels[LogLevels["warn"] = 1] = "warn";
    LogLevels[LogLevels["info"] = 2] = "info";
    LogLevels[LogLevels["debug"] = 3] = "debug";
})(LogLevels = exports.LogLevels || (exports.LogLevels = {}));
;
/**
 * A default, no-operation logger instance, used by default. All messages are lost
 */
class NopLogger {
    log = '';
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
 * Simple logger, storing the individual log messages as an array of {@link LogItem} objects. The logger
 * follows the recommendations on severity levels as described in {@link Logger}.
 *
 * The final log can be retrieved either as the array of Objects via the `logObject`, or
 * as a YAML string via the `log` attributes, respectively.
 *
 * By default, the logger level is set to `LogLevels.info`.
 */
class YamlLogger {
    level;
    theLog;
    constructor(level = LogLevels.info) {
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
    get logObject() {
        return this.theLog;
    }
    get log() {
        return yaml.stringify(this.theLog);
    }
}
exports.YamlLogger = YamlLogger;
/**
 * Return a log item version of a `BNodeToQuads` instance, used to build up a full log message.
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
 * Return a log item version of an `NDegreeHashResult` instance, used to build up a full log message.
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
