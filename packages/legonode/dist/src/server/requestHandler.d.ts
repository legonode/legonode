import type { IncomingMessage, ServerResponse } from "node:http";
import type { CorsConfig, ErrorHandler } from "../config/loadConfig.js";
import type { LegonodePlugin } from "../plugin/pluginAPI.js";
import type { ResponseSchemaMap } from "../validation/routeSchema.js";
import type { LegonodeLogger } from "../logger/requestLogger.js";
import type { TracerFn, TraceStartFn } from "../trace/traceEngine.js";
export declare function clearRuntimeCache(appDir?: string): void;
/** Warm runtime so first request gets sync lookup (Fastify-style: ready before accepting connections). */
export declare function warmRuntime(options: RequestHandlerOptions): Promise<void>;
export type RequestHandlerOptions = {
    appDir?: string;
    maxBodySize?: number;
    errorHandler?: ErrorHandler;
    cors?: CorsConfig;
    plugins?: LegonodePlugin[];
    /** Default response body schemas per status (from legonode.config responses). */
    responses?: ResponseSchemaMap;
    /** Base logger for ctx.logger (request-scoped children will include traceId). */
    logger?: LegonodeLogger;
    /** Dev options from config (e.g. dev.logPretty for pino-pretty in development). */
    dev?: {
        cron?: boolean;
        logPretty?: boolean;
    };
    /** Override default API tracing (span end). */
    tracer?: TracerFn;
    /** Override default API tracing (span start). */
    traceStart?: TraceStartFn;
    /** Set false to disable request lifecycle logging and tracer/traceStart callbacks (default: true). */
    tracing?: boolean;
    /** Set true to reuse context objects from a pool (may help under heavy load with many routes). */
    contextPool?: boolean;
};
export declare function handleNodeRequest(req: IncomingMessage, res: ServerResponse, options?: RequestHandlerOptions): Promise<void>;
//# sourceMappingURL=requestHandler.d.ts.map