import type { LegonodeContext } from "../core/context.js";
import type { LoadedRoute } from "../router/routeLoader.js";
import type { Middleware } from "../middleware/middlewareRunner.js";
export type PipelineEntry = {
    pathname: string;
    method: string;
    route: LoadedRoute;
    middleware: Middleware[];
};
/** Returns a compiled pipeline (validation? + middleware + handler). Never throws; rejects on error. */
export declare function getOrCreatePipeline(appDir: string, pathname: string, method: string, route: LoadedRoute, middleware: Middleware[]): (ctx: LegonodeContext) => unknown | Promise<unknown>;
/** Preload pipelines for the given entries (call after preloadRoutes + preloadMiddleware). */
export declare function preloadPipelines(appDir: string, entries: PipelineEntry[]): void;
export declare function clearPipelineForRoute(appDir: string, pathname: string, method: string): void;
export declare function clearPipelineCache(appDir: string): void;
//# sourceMappingURL=pipelineCache.d.ts.map