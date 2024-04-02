import { NDegreeHashResult, BNodeToQuads, HashToBNodes } from './common';
/**
 * Logging severity levels (following the usual practice, although the full hierarchy is not used)
 * @enum
 */
export declare enum LogLevels {
    error = 0,
    warn = 1,
    info = 2,
    debug = 3
}
/**
 * And individual log item.
 */
export interface LogItem {
    [index: string]: string | string[] | Map<string, string> | boolean | LogItem | LogItem[];
}
export type Log = Map<string, LogItem>;
/**
 * Very simple Logger interface, to be used in the code.
 *
 * Implementations should follow the usual interpretation of log severity levels. E.g., if
 * the Logger is set up with severity level of, say, `LogLevels.info`, then the messages to `debug` should be ignored. If the
 * level is set to `LogLevels.warn`, then only warning and debugging messages should be recorded/displayed, etc.
 *
 * For each call the arguments are:
 * - log_point: the identification of the log point, related to the spec (in practice, this should be identical to the `id` value of the respective HTML element in the specification).
 * - position: short description of the position of the log. The string may be empty (i.e., ""), in which case it will be ignored.
 * - otherData: the 'real' log information.
 *
 */
export interface Logger {
    level: LogLevels;
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
     * Entry point for a increase in stack level. This is issued at each function entry except the top level, and at some, more complex, cycles.
     * Needed if the logger instance intends to create recursive logs or if the structure is complex.
     * @param label - identification of the position in the code
     * @param extra_info - possible extra information on the level increase
     * @param
     */
    push(label: string, extra_info?: string, ...otherData: LogItem[]): void;
    /**
     * Counterpart of the {@link push} method.
     */
    pop(): void;
    /**
     * Accessor to the (readonly) log;
     */
    get log(): string;
}
/**
 * Logger factory: to create new instances of a logger.
 */
export declare class LoggerFactory {
    #private;
    static DEFAULT_LOGGER: string;
    /**
     *
     * @param id Identification string for a new logger type.
     * @param level
     * @returns new logger instance.
     */
    static createLogger(id?: string, level?: LogLevels): Logger | undefined;
    /**
     * List of available logger types.
     */
    static loggerTypes(): string[];
}
/**
 * Return a log item version of a `BNodeToQuads` instance, used to build up a full log message.
 *
 * @param bntq
 * @returns
 */
export declare function bntqToLogItem(bntq: BNodeToQuads): LogItem;
/**
 * Return a log item version of an `NDegreeHashResult` instance, used to build up a full log message.
 *
 * @param ndhrs
 * @returns
 */
export declare function ndhrToLogItem(ndhrs: NDegreeHashResult[]): LogItem[];
/**
 * Return a log item version of an `HashToBNodes` instance, used to build up a full log message.
 *
 * @param htbn
 * @returns
 */
export declare function htbnToLogItem(htbn: HashToBNodes): LogItem[];
