import pino, { type Logger } from "pino";
import pinoPretty from "pino-pretty";

/** Request-scoped logger with traceId in bindings. Use ctx.logger in handlers; tracing is automatic. */
export type LegonodeLogger = Logger;
export type RequestLogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";
export type RequestLogEntry = {
  level: RequestLogLevel;
  args: unknown[];
  timestamp: string;
};

const LOG_LEVEL_METHODS = new Set<RequestLogLevel>(["trace", "debug", "info", "warn", "error", "fatal"]);

let defaultLogger: Logger | null = null;

/** Base logger used to create request-scoped children. Override via setBaseLogger. */
export function getBaseLogger(): Logger {
  if (!defaultLogger) {
    defaultLogger = pino({
      level: process.env.LOG_LEVEL ?? "info"
    });
  }
  return defaultLogger;
}

/** Create a pino logger with pino-pretty for human-readable dev output (e.g. when dev.logPretty is true). */
export function createPrettyLogger(): Logger {
  const stream = pinoPretty({
    colorize: true,
    translateTime: "SYS:HH:MM:ss"
  });
  return pino(
    { level: process.env.LOG_LEVEL ?? "info" },
    stream
  );
}

/** Set a custom base logger (e.g. from legonode.config). Request loggers will be children of this. */
export function setBaseLogger(logger: Logger): void {
  defaultLogger = logger;
}

/** Create a request-scoped logger with traceId so all logs correlate with the same request/trace. */
export function createRequestLogger(traceId: string, base?: Logger, sink?: RequestLogEntry[]): LegonodeLogger {
  const baseLogger = base ?? getBaseLogger();
  const requestLogger = baseLogger.child(traceId ? { traceId } : {});
  if (!sink) return requestLogger;
  return wrapLoggerWithSink(requestLogger, sink);
}

/** No-op logger for context placeholder before runtime assigns request logger. */
export function getNoopLogger(): LegonodeLogger {
  return pino({ level: "silent" });
}

function wrapLoggerWithSink(logger: LegonodeLogger, sink: RequestLogEntry[]): LegonodeLogger {
  return new Proxy(logger, {
    get(target, prop, receiver) {
      const raw = Reflect.get(target, prop, receiver);
      if (typeof prop === "string" && LOG_LEVEL_METHODS.has(prop as RequestLogLevel) && typeof raw === "function") {
        const level = prop as RequestLogLevel;
        return (...args: unknown[]) => {
          sink.push({
            level,
            args,
            timestamp: new Date().toISOString()
          });
          return (raw as (...x: unknown[]) => unknown).apply(target, args);
        };
      }
      if (prop === "child" && typeof raw === "function") {
        return (...args: unknown[]) => {
          const child = (raw as (...x: unknown[]) => LegonodeLogger).apply(target, args);
          return wrapLoggerWithSink(child, sink);
        };
      }
      return raw;
    }
  }) as LegonodeLogger;
}
