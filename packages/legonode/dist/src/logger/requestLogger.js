import pino, {} from "pino";
import pinoPretty from "pino-pretty";
const LOG_LEVEL_METHODS = new Set(["trace", "debug", "info", "warn", "error", "fatal"]);
let defaultLogger = null;
/** Base logger used to create request-scoped children. Override via setBaseLogger. */
export function getBaseLogger() {
    if (!defaultLogger) {
        defaultLogger = pino({
            level: process.env.LOG_LEVEL ?? "info"
        });
    }
    return defaultLogger;
}
/** Create a pino logger with pino-pretty for human-readable dev output (e.g. when dev.logPretty is true). */
export function createPrettyLogger() {
    const stream = pinoPretty({
        colorize: true,
        translateTime: "SYS:HH:MM:ss"
    });
    return pino({ level: process.env.LOG_LEVEL ?? "info" }, stream);
}
/** Set a custom base logger (e.g. from legonode.config). Request loggers will be children of this. */
export function setBaseLogger(logger) {
    defaultLogger = logger;
}
/** Create a request-scoped logger with traceId so all logs correlate with the same request/trace. */
export function createRequestLogger(traceId, base, sink) {
    const baseLogger = base ?? getBaseLogger();
    const requestLogger = baseLogger.child(traceId ? { traceId } : {});
    if (!sink)
        return requestLogger;
    return wrapLoggerWithSink(requestLogger, sink);
}
/** No-op logger for context placeholder before runtime assigns request logger. */
export function getNoopLogger() {
    return pino({ level: "silent" });
}
function wrapLoggerWithSink(logger, sink) {
    return new Proxy(logger, {
        get(target, prop, receiver) {
            const raw = Reflect.get(target, prop, receiver);
            if (typeof prop === "string" && LOG_LEVEL_METHODS.has(prop) && typeof raw === "function") {
                const level = prop;
                return (...args) => {
                    sink.push({
                        level,
                        args,
                        timestamp: new Date().toISOString()
                    });
                    return raw.apply(target, args);
                };
            }
            if (prop === "child" && typeof raw === "function") {
                return (...args) => {
                    const child = raw.apply(target, args);
                    return wrapLoggerWithSink(child, sink);
                };
            }
            return raw;
        }
    });
}
//# sourceMappingURL=requestLogger.js.map