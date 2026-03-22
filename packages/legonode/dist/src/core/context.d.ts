import type { IncomingMessage, ServerResponse } from "node:http";
import type { Readable } from "node:stream";
import type { TraceSpan } from "../trace/traceEngine.js";
import type { RequestLogEntry, LegonodeLogger } from "../logger/requestLogger.js";
/** Exposed on ctx.trace so the user can get the request trace id (e.g. for logging). */
export type TraceRef = {
    readonly traceId: string;
};
import type { EventEmitterFn } from "../events/eventBus.js";
import type { ScheduleRunnerFn } from "../schedules/scheduleLoader.js";
import type { ResponseSchemaMap } from "../validation/routeSchema.js";
export type Response = {
    status?: number;
    headers?: Record<string, string>;
    body?: string | Uint8Array;
} | {
    status?: number;
    headers?: Record<string, string>;
    json: unknown;
};
/** Chainable return type for ctx.res.status(code).json() / .send() / .text() / .html() */
export type ResStatusChain = {
    json: (data: unknown) => void | Promise<void>;
    send: (body: string | Buffer | Uint8Array) => void | Promise<void>;
    text: (body: string) => void | Promise<void>;
    html: (body: string) => void | Promise<void>;
};
/** Fluent response API on ctx.res */
export type LegonodeResponse = {
    /** Raw Node HTTP response */
    raw: ServerResponse;
    /** Set status code; returns chainable .json() / .send() / .text() */
    status: (code: number) => ResStatusChain;
    /** Current status code (e.g. set by status()); used when handler returns data without calling res.json() */
    readonly statusCode: number;
    /** Headers to send (merged when response is sent) */
    headers: Record<string, string | number>;
    /** Set a single header */
    setHeader: (name: string, value: string | number) => void;
    /** Send raw body (HTML, buffer). Default content-type not set; use setHeader for HTML */
    send: (body: string | Buffer | Uint8Array) => void | Promise<void>;
    /** Send HTML (content-type text/html) */
    html: (body: string) => void | Promise<void>;
    /** Send JSON (content-type application/json) */
    json: (data: unknown) => void | Promise<void>;
    /** Send plain text (content-type text/plain) */
    text: (body: string) => void | Promise<void>;
    /** Redirect to url (default 302). Use status as second arg for 301 etc. */
    redirect: (url: string, status?: number) => void | Promise<void>;
    /** Pipe a readable stream as the response body */
    stream: (readable: Readable) => void | Promise<void>;
    /** True if response was already sent (e.g. via res.json()) */
    readonly sent: boolean;
    /** @internal Reuse for another request when using context pool. */
    reinit?: (nodeRes: ServerResponse, defaultStatusRef: DefaultStatusRef, responseSizeRef?: {
        current: number;
    }) => void;
};
export type LegonodeContext = {
    req: IncomingMessage;
    res: LegonodeResponse;
    /** Path params; catch-all [[...x]] params are string[], others are string. */
    params: Record<string, string | string[]>;
    /** Query params (parsed from URL or replaced by validated Record after validation). */
    query: Record<string, string>;
    body: unknown;
    state: Record<string, unknown>;
    emit: EventEmitterFn;
    /** Trigger a cron by name (e.g. "interval.example"). Same run() as in app/cron/*.cron.ts. */
    schedule: ScheduleRunnerFn;
    /** Request-scoped logger with traceId in bindings. Use for application logs; tracing is automatic. */
    logger: LegonodeLogger;
    /** Request-scoped captured logger output for plugin/readback use. */
    log: {
        state: RequestLogEntry[];
    };
    /** Request trace id (one per request). Use ctx.trace.traceId for correlation. */
    trace: TraceRef;
    /** @internal Used by framework for span start/annotate/end; do not use. */
    __traceSpan?: TraceSpan;
    /** @internal Set by framework so res.json() can validate against response schema for current status. */
    __responseSchemaRef?: ResponseSchemaRef;
    /** @internal Set by framework from merged response schema (route + config) so res uses that default when status() not called. */
    __defaultStatusRef?: DefaultStatusRef;
    /** @internal Set by framework when response is sent; used for trace responseSize. */
    __responseSizeRef?: {
        current: number;
    };
    /** @internal Backing for query getter; reset on release for context pool. */
    __queryCache?: Record<string, string> | undefined;
    /** @internal Ref for beforeSend to resolve ctx when res sends. */
    __ctxRef?: {
        current: LegonodeContext | null;
    };
};
/** Map status codes to response body types for typed res.status(code).json(data). */
export type ResponseBodyByStatus = Record<number, unknown>;
/** Chain with json(data) typed by status code. */
export type ResStatusChainTyped<T> = {
    json: (data: T) => void;
    send: (body: string | Buffer | Uint8Array) => void;
    text: (body: string) => void;
    html: (body: string) => void;
};
/** Response API: status(code) accepts any number; .json(data) typed for codes in T when possible. */
export type LegonodeResponseTyped<T extends ResponseBodyByStatus> = Omit<LegonodeResponse, "status" | "json"> & {
    /** Accepts any status code; .json() payload is typed when code is in your response schema. */
    status: (code: number) => ResStatusChainTyped<unknown>;
    json: (data: unknown) => void;
};
/** Context with res.json() typed by status from response schema. */
export type ContextWithResponses<T extends ResponseBodyByStatus> = Omit<LegonodeContext, "res"> & {
    res: LegonodeResponseTyped<T>;
};
/**
 * Context type. Use without a generic for untyped res, or with a response body type map to enforce schema typing.
 * @example
 * export default async function GET(ctx: Context) { ... }
 * // Or with response schema typing:
 * type Res = InferResponseBodies<typeof RESPONSE_SCHEMA>;
 * export default async function GET(ctx: Context<Res>) { ctx.res.status(200).json([...]); }
 */
export type Context<T extends ResponseBodyByStatus = never> = [T] extends [never] ? Omit<LegonodeContext, "__traceSpan" | "__responseSchemaRef" | "__defaultStatusRef" | "__responseSizeRef"> : Omit<ContextWithResponses<T>, "__traceSpan" | "__responseSchemaRef" | "__defaultStatusRef" | "__responseSizeRef">;
export type ResponseSchemaRef = {
    current?: ResponseSchemaMap;
};
export type DefaultStatusRef = {
    current: number;
};
/** Pick default status when handler does not call res.status(): prefer 200, then 201, then 204; else 200. */
export declare function getDefaultStatusFromSchema(schema: ResponseSchemaMap | undefined): number;
export type BeforeSendFn = (ctx: LegonodeContext) => void | Promise<void>;
/** Get context from pool or create new. Use releaseContext(ctx) in finally when done. When usePool is false, always alloc (faster hot path for hello-world). */
export declare function getContext(req: IncomingMessage, res: ServerResponse, usePool?: boolean, beforeSend?: BeforeSendFn): LegonodeContext;
/** Return context to pool. Call in request handler finally. Keeps ctx.res for reuse via reinit. */
export declare function releaseContext(ctx: LegonodeContext): void;
/** Get a request context (from pool when possible). Same as getContext; exported for backwards compatibility. */
export declare const createContext: typeof getContext;
//# sourceMappingURL=context.d.ts.map