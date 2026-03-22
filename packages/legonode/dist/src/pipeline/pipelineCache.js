import { mergeRouteSchema } from "../validation/routeSchema.js";
import { validateRoute, ValidationError } from "../validation/routeSchema.js";
import { compose } from "./compose.js";
const pipelineCache = new Map();
function pipelineCacheKey(appDir, pathname, method) {
    return `${appDir}\0${pathname}\0${method}`;
}
/** Validation as middleware: throws ValidationError on failure, else assigns and calls next(). */
function createValidationMiddleware(mergedSchema, method) {
    return (ctx, next) => {
        const v = validateRoute(mergedSchema, method, {
            body: ctx.body,
            params: ctx.params,
            query: ctx.query
        });
        if (!v.ok)
            throw new ValidationError(v.status, v.json);
        if ("body" in v && v.body !== undefined)
            ctx.body = v.body;
        if ("params" in v && v.params !== undefined)
            ctx.params = v.params;
        if ("query" in v && v.query !== undefined)
            ctx.query = v.query;
        return next();
    };
}
/** Returns a compiled pipeline (validation? + middleware + handler). Never throws; rejects on error. */
export function getOrCreatePipeline(appDir, pathname, method, route, middleware) {
    const key = pipelineCacheKey(appDir, pathname, method);
    let fn = pipelineCache.get(key);
    if (fn)
        return fn;
    const mergedSchema = mergeRouteSchema(route.schema, route.methodSchema);
    const hasValidation = !!(mergedSchema.body ?? mergedSchema.params ?? mergedSchema.query);
    const mwList = hasValidation
        ? [createValidationMiddleware(mergedSchema, method), ...middleware]
        : middleware.length > 0 ? middleware : [];
    const composed = compose(mwList, (ctx) => route.handler(ctx));
    fn = (ctx) => {
        try {
            return composed(ctx);
        }
        catch (e) {
            return Promise.reject(e);
        }
    };
    pipelineCache.set(key, fn);
    return fn;
}
/** Preload pipelines for the given entries (call after preloadRoutes + preloadMiddleware). */
export function preloadPipelines(appDir, entries) {
    for (const { pathname, method, route, middleware } of entries) {
        getOrCreatePipeline(appDir, pathname, method, route, middleware);
    }
}
const ALL_HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
export function clearPipelineForRoute(appDir, pathname, method) {
    if (method === "") {
        for (const m of ALL_HTTP_METHODS)
            pipelineCache.delete(pipelineCacheKey(appDir, pathname, m));
    }
    else {
        pipelineCache.delete(pipelineCacheKey(appDir, pathname, method));
    }
}
export function clearPipelineCache(appDir) {
    const prefix = appDir + "\0";
    for (const key of pipelineCache.keys()) {
        if (key.startsWith(prefix))
            pipelineCache.delete(key);
    }
}
//# sourceMappingURL=pipelineCache.js.map