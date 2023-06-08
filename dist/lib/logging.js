"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.htbnToLogItem = exports.ndhrToLogItem = exports.bntqToLogItem = exports.YamlLogger = exports.NopLogger = exports.LogLevels = void 0;
/**
 * Logging environment, used by the rest of the code. By default, no logging occurs; the user can set his/her own
 * logging environment. This module also includes a logger to create a recursive log in YAML.
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
})(LogLevels || (exports.LogLevels = LogLevels = {}));
;
/**
 * A default, no-operation logger instance, used by default. All methods are empty, ie, all messages are lost...
 */
class NopLogger {
    log = '';
    log_object = {};
    debug(_log_point, _position, ..._otherData) { }
    ;
    warn(_log_point, _position, ..._otherData) { }
    ;
    error(_log_point, _position, ..._otherData) { }
    ;
    info(_log_point, _position, ..._otherData) { }
    ;
    push(_label, _extra_info, ..._otherData) { }
    ;
    pop() { }
    ;
}
exports.NopLogger = NopLogger;
/**
 * Simple logger, storing the individual log messages as an array of {@link LogItem} objects. The logger
 * follows the recommendations on severity levels as described in {@link Logger}.
 *
 * The "current" log is an array of {@link LogItem} instances, filled by subsequent logger calls.
 * In case of a call to `push` this instance is pushed on an internal stack and a new array is created.
 *
 * The final log can be retrieved either as the array of Objects via the `log_object`, or
 * as a YAML string via the `log` attributes, respectively.
 *
 * By default, the logger level is set to `LogLevels.info`.
 */
class YamlLogger {
    level;
    top_log = {};
    current_log;
    log_stack = [];
    constructor(level = LogLevels.info) {
        this.level = level;
        const ca_level = [];
        this.top_log["ca"] = ca_level;
        this.current_log = ca_level;
    }
    emitMessage(mtype, log_id, position, extras) {
        const item = {};
        if (position !== '') {
            item["log point"] = mtype === "info" ? `${position}` : `[${mtype}] ${position}`;
        }
        if (extras.length !== 0) {
            item["with"] = extras;
        }
        const full_item = {};
        full_item[log_id] = item;
        this.current_log.push(full_item);
    }
    debug(log_id, position, ...extras) {
        if (this.level >= LogLevels.debug)
            this.emitMessage("debug", log_id, position, extras);
    }
    info(log_id, position, ...extras) {
        if (this.level >= LogLevels.info)
            this.emitMessage("info", log_id, position, extras);
    }
    warn(log_id, position, ...extras) {
        if (this.level >= LogLevels.warn)
            this.emitMessage("warn", log_id, position, extras);
    }
    error(log_id, position, ...extras) {
        if (this.level >= LogLevels.error)
            this.emitMessage("error", log_id, position, extras);
    }
    push(label, extra_info, ...extras) {
        const new_level = [];
        const new_level_ref = {};
        new_level_ref[label] = new_level;
        if (extra_info && extra_info !== "") {
            new_level.push({
                "push info": extra_info
            });
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
    pop() {
        this.current_log = this.log_stack.pop();
    }
    get log_object() {
        return this.top_log;
    }
    get log() {
        return yaml.stringify(this.log_object, { aliasDuplicateObjects: false });
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
 *
 * @param ndhrs
 * @returns
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
/**
 * Return a log item version of an `HashToBNodes` instance, used to build up a full log message.
 *
 * @param htbn
 * @returns
 */
function htbnToLogItem(htbn) {
    return Object.keys(htbn).map((index) => {
        return {
            "hash": index,
            "bnodes": htbn[index]
        };
    });
}
exports.htbnToLogItem = htbnToLogItem;
