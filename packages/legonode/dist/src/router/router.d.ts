import { type LoadedRoute } from "./routeLoader.js";
/** Route + params without spreading LoadedRoute (avoids allocation). Catch-all params are string[]. */
export type ResolvedRoute = {
    route: LoadedRoute;
    params: Record<string, string | string[]>;
    /** Group-aware pathname derived from file path for middleware resolution. */
    middlewarePath: string;
};
/**
 * Resolve route using per-method radix tree (find-my-way style): one tree per HTTP method,
 * direct filePath from match, no method map lookup.
 */
export declare function resolveRoute(method: string, pathname: string, appDir: string): ResolvedRoute | null | Promise<ResolvedRoute | null>;
/** Preload all routes and warm per-method radix trees so resolveRoute is sync. */
export declare function preloadRoutes(appDir: string): Promise<void>;
/** Reload handler cache for the given route file (dev hot reload). */
export declare function reloadRoute(appDir: string, filePath: string): Promise<void>;
//# sourceMappingURL=router.d.ts.map