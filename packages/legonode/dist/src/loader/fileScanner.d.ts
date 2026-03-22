export type ScannedRoute = {
    pathname: string;
    filePath: string;
    /** Set for method-specific files (get.ts, get.route.ts, post.ts, etc.). Empty for route.ts (handles all methods). */
    method?: string;
};
export type ScannedMiddleware = {
    pathPrefix: string;
    filePath: string;
};
export declare function scanAppFiles(appDir: string): ScannedRoute[];
/**
 * Scan only the given directory for route files (no nested subdirs).
 * pathname is computed relative to appDir so it matches the route path.
 */
export declare function scanRouteFilesInDir(appDir: string, dir: string): ScannedRoute[];
export declare function scanMiddlewareFiles(appDir: string): ScannedMiddleware[];
//# sourceMappingURL=fileScanner.d.ts.map