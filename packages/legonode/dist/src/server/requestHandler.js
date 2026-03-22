import { resolve } from "node:path";
import { createRuntime } from "../core/runtime.js";
import { getDefaultStatusFromSchema, releaseContext } from "../core/context.js";
import { parseBody } from "../body/parseBody.js";
import { getCorsHeaders, shouldRejectCorsRequest } from "../cors/cors.js";
import { getOrCreateEventBus } from "../events/eventExecutor.js";
import { getOrCreateScheduleRunner } from "../schedules/scheduleLoader.js";
import { getOrCreateMiddlewareResolver, preloadMiddleware, } from "../middleware/middlewareResolver.js";
import { NextError } from "../middleware/middlewareRunner.js";
import { getOrCreatePipeline, preloadPipelines, } from "../pipeline/pipelineCache.js";
import { resolveRoute, preloadRoutes, } from "../router/router.js";
import { getRouteTable } from "../router/routeTable.js";
import { getStringifier } from "../json/fastStringify.js";
import { ValidationError } from "../validation/routeSchema.js";
import { setBaseLogger, createPrettyLogger, getBaseLogger, } from "../logger/requestLogger.js";
import { appLogger } from "../utils/logger.js";
import { defaultErrorHandler } from "./errorHandler.js";
const runtimeCache = new Map();
export function clearRuntimeCache(appDir) {
    if (appDir !== undefined) {
        runtimeCache.delete(resolve(appDir));
    }
    else {
        runtimeCache.clear();
    }
}
/** Warm runtime so first request gets sync lookup (Fastify-style: ready before accepting connections). */
export async function warmRuntime(options) {
    const r = getOrCreateRuntime(options);
    if (typeof r.then === "function")
        await r;
}
function getOrCreateRuntime(options) {
    const appDir = options.appDir ?? "./src";
    const key = resolve(appDir);
    const cached = runtimeCache.get(key);
    if (cached !== undefined) {
        if (typeof cached.then === "function")
            return cached;
        return cached;
    }
    const promise = (async () => {
        if (options.logger !== undefined) {
            setBaseLogger(options.logger);
        }
        else if (options.dev?.logPretty) {
            setBaseLogger(createPrettyLogger());
        }
        const [eventBus, scheduleRunner] = await Promise.all([
            getOrCreateEventBus(appDir),
            getOrCreateScheduleRunner(appDir),
        ]);
        const tracer = options.tracer
            ? (data) => {
                defaultTracer(data);
                options.tracer(data);
            }
            : defaultTracer;
        const traceStart = options.traceStart
            ? (data) => {
                defaultTraceStart(data);
                options.traceStart(data);
            }
            : defaultTraceStart;
        const runtime = createRuntime({
            appDir: options.appDir,
            plugins: options.plugins ?? [],
            eventBus,
            scheduleRunner,
            tracer,
            traceStart,
            tracing: options.tracing !== false,
            ...(options.contextPool !== undefined && {
                contextPool: options.contextPool,
            }),
        });
        await preloadRoutes(appDir);
        const table = getRouteTable(appDir);
        const byPath = new Map();
        for (const r of table) {
            let fileByMethod = byPath.get(r.pathname);
            if (!fileByMethod) {
                fileByMethod = {};
                byPath.set(r.pathname, fileByMethod);
            }
            fileByMethod[r.method ?? ""] = r.filePath;
        }
        const pathnameMethodPairs = Array.from(byPath.entries()).flatMap(([pathname, fileByMethod]) => Object.keys(fileByMethod).map((method) => ({ pathname, method })));
        await preloadMiddleware(appDir, pathnameMethodPairs);
        const middlewareResolver = getOrCreateMiddlewareResolver(appDir);
        const pipelineEntries = [];
        for (const { pathname, method } of pathnameMethodPairs) {
            const routeResult = resolveRoute(method, pathname, appDir);
            const route = routeResult != null &&
                typeof routeResult.then === "function"
                ? await routeResult
                : routeResult;
            if (!route)
                continue;
            const mwResult = middlewareResolver.resolveForPathname(route.middlewarePath, method);
            const middleware = mwResult != null &&
                typeof mwResult.then === "function"
                ? await mwResult
                : mwResult;
            pipelineEntries.push({
                pathname: route.middlewarePath,
                method,
                route: route.route,
                middleware,
            });
        }
        preloadPipelines(appDir, pipelineEntries);
        runtimeCache.set(key, runtime);
        return runtime;
    })();
    runtimeCache.set(key, promise);
    return promise;
}
function defaultTraceStart(data) {
    getBaseLogger()
        .child({ traceId: data.traceId })
        .info({ method: data.method, pathname: data.pathname }, "request started");
}
function defaultTracer(data) {
    getBaseLogger()
        .child({ traceId: data.traceId })
        .info({
        method: data.method,
        pathname: data.pathname,
        ...(data.statusCode != null && { statusCode: data.statusCode }),
        durationMs: data.durationMs,
        ...(data.routeId != null && { routeId: data.routeId }),
        ...(data.responseSize != null && { responseSize: data.responseSize }),
        ...(data.error != null && { error: data.error }),
    }, "request completed");
}
function toFrameworkResponse(result) {
    if (result && typeof result === "object") {
        const obj = result;
        // Treat as framework Response only when it uses the response shape explicitly.
        if ("json" in obj) {
            return result;
        }
        if ("body" in obj && ("status" in obj || "headers" in obj)) {
            return result;
        }
    }
    return { json: result };
}
const HELLO_WORLD_JSON = Buffer.from('{"hello":"world"}', "utf8");
const NOT_FOUND_MSG = "Route not found";
const INTERNAL_ERROR_JSON = Buffer.from('{"error":"Internal Server Error"}', "utf8");
function isHelloWorld(obj) {
    return (obj != null &&
        typeof obj === "object" &&
        !Array.isArray(obj) &&
        "hello" in obj &&
        obj.hello === "world" &&
        Object.keys(obj).length === 1);
}
function sendFrameworkResponse(res, response, extraStatus, extraHeaders, responseSchema, 
/** When set, use this for JSON body instead of serializing (avoids double serialize). */
preSerializedJson) {
    const status = response.status ?? extraStatus ?? 200;
    res.statusCode = status;
    if (extraHeaders) {
        for (const [k, v] of Object.entries(extraHeaders))
            res.setHeader(k, String(v));
    }
    const headers = response.headers ?? {};
    for (const [k, v] of Object.entries(headers))
        res.setHeader(k, v);
    if ("json" in response) {
        if (!res.getHeader("content-type"))
            res.setHeader("content-type", "application/json; charset=utf-8");
        if (status === 200 && isHelloWorld(response.json)) {
            res.end(HELLO_WORLD_JSON);
            return;
        }
        const stringifier = getStringifier(responseSchema, status);
        let payload;
        if (preSerializedJson) {
            payload = preSerializedJson;
        }
        else if (stringifier) {
            try {
                payload = stringifier(response.json);
            }
            catch {
                payload = JSON.stringify(response.json);
            }
        }
        else {
            payload = JSON.stringify(response.json);
        }
        res.end(payload);
        return;
    }
    const body = response.body ?? "";
    res.end(typeof body === "string" ? body : Buffer.from(body));
}
export async function handleNodeRequest(req, res, options = {}) {
    const appDir = options.appDir ?? "./src";
    const method = (req.method ?? "GET").toUpperCase();
    const rawUrl = req.url ?? "/";
    const q = rawUrl.indexOf("?");
    const pathnameRaw = q === -1 ? rawUrl : rawUrl.slice(0, q);
    const pathname = pathnameRaw.startsWith("/")
        ? pathnameRaw
        : "/" + pathnameRaw;
    const runtimeOrPromise = getOrCreateRuntime(options);
    const runtime = typeof runtimeOrPromise.then === "function"
        ? (await runtimeOrPromise)
        : runtimeOrPromise;
    const ctx = runtime.createRequestContext(req, res);
    if (method === "GET" || method === "HEAD") {
        ctx.body = null;
    }
    else {
        const maxBodySize = options.maxBodySize ?? 1_000_000;
        const parseResult = await parseBody(req, maxBodySize);
        if (!parseResult.ok) {
            res.statusCode = parseResult.status;
            res.setHeader("content-type", "application/json; charset=utf-8");
            res.end(JSON.stringify(parseResult.body));
            return;
        }
        ctx.body = parseResult.body;
    }
    if (runtime.hasPlugins)
        await runtime.runHook("onRequest", ctx);
    const corsConfig = options.cors ?? {};
    if (shouldRejectCorsRequest(corsConfig, req)) {
        const rawOrigin = req.headers.origin;
        const requestOrigin = typeof rawOrigin === "string"
            ? rawOrigin
            : Array.isArray(rawOrigin)
                ? (rawOrigin[0] ?? "unknown")
                : "unknown";
        res.statusCode = 403;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify({
            error: `CORS policy violation: origin "${requestOrigin}" is not allowed.`,
            code: "CORS_ORIGIN_NOT_ALLOWED",
            hint: "Add this origin to `cors.origin`",
        }));
        return;
    }
    const corsHeaders = getCorsHeaders(corsConfig, req);
    for (const [k, v] of Object.entries(corsHeaders))
        res.setHeader(k, v);
    if (method === "OPTIONS") {
        res.statusCode = 204;
        res.end();
        return;
    }
    ctx.__traceSpan?.start({ method, pathname });
    const routeResult = resolveRoute(method, pathname, appDir);
    const route = (routeResult != null &&
        typeof routeResult.then === "function"
        ? await routeResult
        : routeResult);
    const matchedRouteId = route != null
        ? (route.route?.routeId ??
            route.routeId ??
            null)
        : null;
    let pathnameForMiddleware;
    let middleware;
    if (route) {
        ctx.params = route.params;
        const loaded = route.route;
        const mergedResponseSchema = loaded.responseSchema
            ? { ...(options.responses ?? {}), ...loaded.responseSchema }
            : options.responses;
        if (ctx.__responseSchemaRef && mergedResponseSchema !== undefined)
            ctx.__responseSchemaRef.current = mergedResponseSchema;
        if (ctx.__defaultStatusRef && mergedResponseSchema !== undefined)
            ctx.__defaultStatusRef.current =
                getDefaultStatusFromSchema(mergedResponseSchema);
        if (runtime.hasPlugins)
            await runtime.runHook("onRouteMatch", ctx);
        pathnameForMiddleware = route.middlewarePath;
        const middlewareResolver = getOrCreateMiddlewareResolver(appDir);
        const middlewareResult = middlewareResolver.resolveForPathname(pathnameForMiddleware, method);
        middleware = (middlewareResult != null &&
            typeof middlewareResult.then === "function"
            ? await middlewareResult
            : middlewareResult);
        if (runtime.hasPlugins) {
            await runtime.runHook("onMiddlewareResolved", ctx, {
                pathname: pathnameForMiddleware,
                method,
                count: middleware.length,
            });
        }
    }
    else {
        pathnameForMiddleware = pathname;
        middleware = [];
    }
    let requestError;
    try {
        let handlerResult;
        if (runtime.hasPlugins)
            await runtime.runHook("beforeHandler", ctx);
        if (route) {
            const pipeline = getOrCreatePipeline(appDir, pathnameForMiddleware, method, route.route, middleware);
            const raw = pipeline(ctx);
            handlerResult =
                raw != null && typeof raw.then === "function"
                    ? await raw
                    : raw;
        }
        else {
            handlerResult = {
                status: 404,
                json: { error: NOT_FOUND_MSG, method, pathname },
            };
        }
        if (runtime.hasPlugins)
            await runtime.runHook("afterHandler", ctx, handlerResult);
        if (ctx.res.sent) {
            // User already sent via ctx.res.json(), ctx.res.send(), etc.
        }
        else {
            if (!ctx.res.sent) {
                if (runtime.hasPlugins)
                    await runtime.runHook("beforeResponse", ctx);
                const response = toFrameworkResponse(handlerResult);
                const mergedResponseSchema = route && ctx.__responseSchemaRef?.current !== undefined
                    ? ctx.__responseSchemaRef.current
                    : options.responses;
                const statusCode = ctx.res.statusCode ?? 200;
                let preSerializedJson;
                if ("json" in response) {
                    if (statusCode === 200 && isHelloWorld(response.json)) {
                        if (ctx.__responseSizeRef)
                            ctx.__responseSizeRef.current = HELLO_WORLD_JSON.length;
                    }
                    else {
                        const stringifier = getStringifier(mergedResponseSchema, statusCode);
                        if (stringifier) {
                            try {
                                preSerializedJson = stringifier(response.json);
                            }
                            catch {
                                preSerializedJson = JSON.stringify(response.json);
                            }
                        }
                        else {
                            preSerializedJson = JSON.stringify(response.json);
                        }
                        if (ctx.__responseSizeRef && preSerializedJson)
                            ctx.__responseSizeRef.current =
                                Buffer.byteLength(preSerializedJson);
                    }
                }
                else if (ctx.__responseSizeRef && "body" in response) {
                    const b = response.body;
                    ctx.__responseSizeRef.current =
                        b === undefined
                            ? 0
                            : typeof b === "string"
                                ? Buffer.byteLength(b)
                                : b.length;
                }
                sendFrameworkResponse(res, response, ctx.res.statusCode, ctx.res.headers, mergedResponseSchema, preSerializedJson);
            }
        }
    }
    catch (err) {
        requestError = err;
        if (err instanceof ValidationError) {
            if (!ctx.res.sent) {
                res.statusCode = err.status;
                res.setHeader("content-type", "application/json; charset=utf-8");
                res.end(JSON.stringify(err.json));
            }
            return;
        }
        const actualErr = err instanceof NextError ? err.error : err;
        if (runtime.hasPlugins)
            await runtime.runHook("onError", ctx, actualErr).catch(() => { });
        const errorHandler = options.errorHandler ?? defaultErrorHandler;
        try {
            if (!ctx.res.sent && runtime.hasPlugins)
                await runtime.runHook("beforeResponse", ctx);
            const result = await errorHandler(ctx, actualErr);
            if (!ctx.res.sent && result != null && typeof result === "object") {
                const status = "status" in result ? result.status : 500;
                const headers = "headers" in result ? result.headers : undefined;
                if ("json" in result) {
                    res.statusCode = status ?? 500;
                    if (headers)
                        for (const [k, v] of Object.entries(headers))
                            res.setHeader(k, String(v));
                    if (!res.getHeader("content-type"))
                        res.setHeader("content-type", "application/json; charset=utf-8");
                    res.end(JSON.stringify(result.json));
                }
                else if ("body" in result) {
                    res.statusCode = status ?? 500;
                    if (headers)
                        for (const [k, v] of Object.entries(headers))
                            res.setHeader(k, String(v));
                    const body = result.body ?? "";
                    res.end(typeof body === "string" ? body : Buffer.from(body));
                }
            }
        }
        catch (handlerErr) {
            if (!ctx.res.sent) {
                res.statusCode = 500;
                res.setHeader("content-type", "application/json; charset=utf-8");
                res.end(INTERNAL_ERROR_JSON);
            }
            appLogger.error(handlerErr);
        }
    }
    finally {
        const span = ctx.__traceSpan;
        if (span) {
            span.annotate("statusCode", res.statusCode);
            span.annotate("routeId", matchedRouteId);
            span.annotate("responseSize", ctx.__responseSizeRef?.current ?? 0);
            if (requestError !== undefined) {
                const actualErr = requestError instanceof NextError ? requestError.error : requestError;
                span.annotate("error", actualErr instanceof Error ? actualErr.message : String(actualErr));
            }
            span.end();
        }
        if (runtime.hasPlugins)
            await runtime.runHook("afterResponse", ctx);
        if (runtime.contextPool)
            releaseContext(ctx);
    }
}
//# sourceMappingURL=requestHandler.js.map