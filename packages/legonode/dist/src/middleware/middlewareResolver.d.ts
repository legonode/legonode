import type { Middleware } from "./middlewareRunner.js";
export type MiddlewareResolver = {
    resolveForPathname: (pathname: string, method: string) => Middleware[] | Promise<Middleware[]>;
};
export declare function createMiddlewareResolver(appDir: string): MiddlewareResolver;
export declare function clearMiddlewareResolverCache(appDir?: string): void;
export declare function getOrCreateMiddlewareResolver(appDir: string): MiddlewareResolver;
/** Pathname + method pairs to preload (e.g. from route table). */
export declare function preloadMiddleware(appDir: string, pathnameMethodPairs: Array<{
    pathname: string;
    method: string;
}>): Promise<void>;
//# sourceMappingURL=middlewareResolver.d.ts.map