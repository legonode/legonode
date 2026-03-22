import type { ScannedRoute } from "../loader/fileScanner.js";
import type { RadixTree, RadixTreePerMethod } from "./radixTree.js";
export type ValidateRouteConflictsOptions = {
    /**
     * When true (default), scan appDir recursively and validate all routes.
     * When false, scan only appDir (that directory only, no nested subdirs).
     */
    isRecursive?: boolean;
};
/**
 * For each path, collect which methods each file actually provides (by loading route.ts).
 * If any (path, method) has more than one file, throw.
 */
export declare function validateRouteConflictsAsync(appDir: string, options?: ValidateRouteConflictsOptions): Promise<void>;
export declare function getRouteTable(appDir: string): ScannedRoute[];
/** Radix tree for O(path depth) route lookup. Cached per appDir. */
export declare function getRadixTree(appDir: string): RadixTree;
/** Per-method radix tree (find-my-way style): one tree per HTTP method, direct filePath in match. Cached per appDir+method. */
export declare function getRadixTreeForMethod(appDir: string, method: string): RadixTreePerMethod;
/** Add or refresh routes for a single route file and update radix caches lazily. */
export declare function addRouteFileToTable(appDir: string, filePath: string): void;
/** Remove all routes coming from a specific route file and invalidate radix caches. */
export declare function removeRouteFileFromTable(appDir: string, filePath: string): void;
export declare function clearRouteTableCache(appDir?: string): void;
//# sourceMappingURL=routeTable.d.ts.map