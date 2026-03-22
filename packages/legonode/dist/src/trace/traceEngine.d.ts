/** Data passed when a request span starts. Log as [datetime][traceId] method pathname. */
export type TraceStartData = {
    traceId: string;
    method: string;
    pathname: string;
    startTime: string;
};
/** Data recorded for one request span. Passed to the tracer callback on span end. */
export type TraceData = {
    /** Unique id for this request. One per request; use to correlate logs and tracer output. */
    traceId: string;
    /** HTTP method (e.g. GET, POST). */
    method: string;
    /** Request pathname. */
    pathname: string;
    /** Resolved route id (e.g. /api/users) or undefined if no route matched. */
    routeId?: string;
    /** Response status code. */
    statusCode?: number;
    /** Response body size in bytes (when sent via ctx.res or return). */
    responseSize?: number;
    /** Span duration in milliseconds. */
    durationMs: number;
    /** Start time (ISO string). */
    startTime: string;
    /** End time (ISO string). */
    endTime: string;
    /** Optional error message when handler threw. */
    error?: string;
    /** Custom annotations (set internally by framework from request lifecycle). */
    annotations: Record<string, unknown>;
};
export type TracerFn = (data: TraceData) => void;
export type TraceStartFn = (data: TraceStartData) => void;
export type TraceSpan = {
    /** Unique id for this request. One per request; use in logs and response headers. */
    readonly traceId: string;
    start: (meta?: Record<string, unknown>) => void;
    annotate: (key: string, value: unknown) => void;
    end: () => void;
};
/** Shared no-op span when tracing is disabled; avoids per-request allocation and UUID. */
export declare const NOOP_TRACE: TraceSpan;
export declare function createTraceSpan(tracer?: TracerFn, traceStart?: TraceStartFn): TraceSpan;
//# sourceMappingURL=traceEngine.d.ts.map