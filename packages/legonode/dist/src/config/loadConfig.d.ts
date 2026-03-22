import type { LegonodeContext } from "../core/context.js";
import type { LegonodePlugin } from "../plugin/pluginAPI.js";
import type { ResponseSchemaMap } from "../validation/routeSchema.js";
import type { LegonodeLogger } from "../logger/requestLogger.js";
import type { TracerFn, TraceStartFn } from "../trace/traceEngine.js";
export type CorsConfig = {
    origin?: string | string[] | boolean;
    methods?: string[];
    allowedHeaders?: string[];
    credentials?: boolean;
};
export type ErrorHandlerResult = {
    status?: number;
    headers?: Record<string, string>;
    json?: unknown;
} | {
    status?: number;
    headers?: Record<string, string>;
    body?: string | Uint8Array;
};
export type ErrorHandler = (ctx: LegonodeContext, err: unknown) => void | ErrorHandlerResult | Promise<void | ErrorHandlerResult>;
export type LegonodeConfig = {
    appDir?: string;
    buildPath?: string;
    /** Port for dev/start (CLI --port overrides). */
    port?: number;
    /** Dev-only options. */
    dev?: {
        /** Set false to disable cron jobs in development (default: true). */
        cron?: boolean;
        /** Set true to use pino-pretty for human-readable logs in development. */
        logPretty?: boolean;
    };
    maxBodySize?: number;
    errorHandler?: ErrorHandler;
    cors?: CorsConfig;
    plugins?: LegonodePlugin[];
    /** Default response body schemas per status code. Enforced before send; invalid response becomes 500. */
    responses?: ResponseSchemaMap;
    /** Base logger for request loggers (ctx.logger). If not set, a default pino logger is used. */
    logger?: LegonodeLogger;
    /** Set false to disable request lifecycle logging (request started / request completed) and tracer/traceStart callbacks (default: true). */
    tracing?: boolean;
    /** Called when a request span ends with trace data (method, pathname, duration, status, responseSize, etc.). */
    tracer?: TracerFn;
    /** Called when a request span starts. Default logs "request started" via logger. */
    traceStart?: TraceStartFn;
};
export declare function loadConfig(cwd: string): Promise<LegonodeConfig>;
export declare function getAppDir(config: LegonodeConfig, cwd: string): string | undefined;
export declare function getBuildPath(config: LegonodeConfig, cwd: string): string;
export type RequestHandlerOptionsFromConfig = {
    appDir: string;
    maxBodySize?: number;
    errorHandler?: ErrorHandler;
    cors?: CorsConfig;
    plugins?: LegonodePlugin[];
    responses?: ResponseSchemaMap;
    logger?: LegonodeLogger;
    dev?: {
        cron?: boolean;
        logPretty?: boolean;
    };
    tracing?: boolean;
    tracer?: TracerFn;
    traceStart?: TraceStartFn;
};
export declare function getRequestHandlerOptionsFromConfig(config: LegonodeConfig, cwd: string, overrides?: {
    appDir?: string;
}): RequestHandlerOptionsFromConfig;
//# sourceMappingURL=loadConfig.d.ts.map