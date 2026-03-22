import { randomUUID } from "node:crypto";
/** Shared no-op span when tracing is disabled; avoids per-request allocation and UUID. */
export const NOOP_TRACE = {
    get traceId() {
        return "";
    },
    start: () => { },
    annotate: () => { },
    end: () => { }
};
export function createTraceSpan(tracer, traceStart) {
    if (tracer === undefined && traceStart === undefined)
        return NOOP_TRACE;
    const traceId = randomUUID();
    let startTime = null;
    const annotations = {};
    let initialMeta = {};
    return {
        get traceId() {
            return traceId;
        },
        start(meta) {
            startTime = Date.now();
            initialMeta = meta ?? {};
            const method = meta?.method ?? "GET";
            const pathname = meta?.pathname ?? "";
            traceStart?.({
                traceId,
                method,
                pathname,
                startTime: new Date(startTime).toISOString(),
            });
        },
        annotate(key, value) {
            annotations[key] = value;
        },
        end() {
            const endTime = Date.now();
            const start = startTime ?? endTime;
            const durationMs = endTime - start;
            const routeId = annotations.routeId;
            const statusCode = annotations.statusCode;
            const error = annotations.error;
            const responseSize = annotations.responseSize;
            const data = {
                traceId,
                ...initialMeta,
                method: initialMeta.method ?? "GET",
                pathname: initialMeta.pathname ?? "",
                durationMs,
                startTime: new Date(start).toISOString(),
                endTime: new Date(endTime).toISOString(),
                annotations: { ...annotations },
                ...(routeId !== undefined && routeId !== null && { routeId }),
                ...(statusCode !== undefined && statusCode !== null && { statusCode }),
                ...(responseSize !== undefined && responseSize !== null && { responseSize }),
                ...(error !== undefined && error !== null && { error }),
            };
            tracer?.(data);
        },
    };
}
//# sourceMappingURL=traceEngine.js.map