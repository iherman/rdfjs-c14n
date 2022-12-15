"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ndhrToString = exports.bntqToString = exports.NopLogger = void 0;
/**
 * Helper functions to make logging more readable.
 *
 * @copyright Ivan Herman 2023
 *
 * @packageDocumentation
 */
const common_1 = require("./common");
/**
 * A default, no-operation logger instance, used by default.
 */
class NopLogger {
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
 * Return a string version of a @{BNodeToQuads} instance, usable for debug
 *
 * @param bntq
 * @returns
 */
function bntqToString(bntq) {
    const bntnq = {};
    for (const bn in bntq) {
        bntnq[bn] = bntq[bn].map(common_1.quadToNquad);
    }
    return `${JSON.stringify(bntnq, null, 4)}`;
}
exports.bntqToString = bntqToString;
/**
 * Return a string version of an @{NDegreeHashResult} instance, usable for debug
 */
function ndhrToString(ndhrs) {
    return ndhrs.map((ndhr) => `Hash: "${ndhr.hash}"${ndhr.issuer.toString()}`).join(',\n');
}
exports.ndhrToString = ndhrToString;
