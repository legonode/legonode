import type { ScannedMiddleware } from "../loader/fileScanner.js";
export declare function getMiddlewareTable(appDir: string): ScannedMiddleware[];
/** Ordered list of middleware file paths for this pathname (ancestor first). Uses exact pathPrefix so group middleware (e.g. api/(user)) only runs for routes inside that group. */
export declare function getMiddlewarePathsForPathname(pathname: string, appDir: string): string[];
export declare function clearMiddlewareTableCache(appDir?: string): void;
//# sourceMappingURL=middlewareTable.d.ts.map