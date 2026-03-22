import { type Logger } from "pino";
/** Request-scoped logger with traceId in bindings. Use ctx.logger in handlers; tracing is automatic. */
export type LegonodeLogger = Logger;
export type RequestLogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";
export type RequestLogEntry = {
    level: RequestLogLevel;
    args: unknown[];
    timestamp: string;
};
/** Base logger used to create request-scoped children. Override via setBaseLogger. */
export declare function getBaseLogger(): Logger;
/** Create a pino logger with pino-pretty for human-readable dev output (e.g. when dev.logPretty is true). */
export declare function createPrettyLogger(): Logger;
/** Set a custom base logger (e.g. from legonode.config). Request loggers will be children of this. */
export declare function setBaseLogger(logger: Logger): void;
/** Create a request-scoped logger with traceId so all logs correlate with the same request/trace. */
export declare function createRequestLogger(traceId: string, base?: Logger, sink?: RequestLogEntry[]): LegonodeLogger;
/** No-op logger for context placeholder before runtime assigns request logger. */
export declare function getNoopLogger(): LegonodeLogger;
//# sourceMappingURL=requestLogger.d.ts.map