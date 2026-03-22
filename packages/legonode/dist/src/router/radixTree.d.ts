import type { ScannedRoute } from "../loader/fileScanner.js";
import type { MatchResult } from "./matcher.js";
/** Match result when using per-method tree (no fileByMethod lookup). Catch-all params are string[]. */
export type MatchResultPerMethod = {
    routeId: string;
    filePath: string;
    params: Record<string, string | string[]>;
};
export type RadixTree = {
    match(pathname: string): MatchResult | null;
};
/**
 * Build a radix tree from scanned routes. Groups by pathname and merges method-specific files (get.ts, post.ts) with route.ts.
 */
export declare function buildRadixTree(routes: ScannedRoute[]): RadixTree;
export type RadixTreePerMethod = {
    match(pathname: string): MatchResultPerMethod | null;
};
/**
 * Build a radix tree for a single HTTP method (find-my-way style).
 * Lookup is O(path depth) with no method map; returns filePath directly.
 */
export declare function buildRadixTreeForMethod(routes: ScannedRoute[], method: string): RadixTreePerMethod;
//# sourceMappingURL=radixTree.d.ts.map