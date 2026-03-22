import { scanAppFiles, scanRouteFilesInDir } from "../loader/fileScanner.js";
import { dirname, resolve } from "node:path";
import { buildRadixTree, buildRadixTreeForMethod } from "./radixTree.js";
import { getMethodsExportedByRouteFile } from "./routeLoader.js";
const cache = new Map();
const radixCache = new Map();
/** Per-method trees (find-my-way style): key = `${appDir}\0${method}` */
const radixPerMethodCache = new Map();
function getRoutesDir(appDir) {
    return resolve(appDir, "router");
}
function normalizeRoutePath(pathname) {
    const segments = pathname.replace(/^\/+/, "").split("/").filter(Boolean);
    const withoutGroups = segments.filter((s) => !(s.startsWith("(") && s.endsWith(")")));
    return "/" + withoutGroups.join("/");
}
/**
 * For each path, collect which methods each file actually provides (by loading route.ts).
 * If any (path, method) has more than one file, throw.
 */
export async function validateRouteConflictsAsync(appDir, options = {}) {
    const { isRecursive = true } = options;
    const routesDir = getRoutesDir(appDir);
    const routes = isRecursive
        ? scanAppFiles(routesDir)
        : scanRouteFilesInDir(routesDir, routesDir);
    const byPath = new Map();
    for (const route of routes) {
        const key = normalizeRoutePath(route.pathname);
        const list = byPath.get(key);
        if (list)
            list.push(route);
        else
            byPath.set(key, [route]);
    }
    for (const [normalizedPath, list] of byPath) {
        /** method -> file paths that provide it */
        const byMethod = new Map();
        for (const r of list) {
            const m = r.method ?? "";
            const methods = m === "" ? await getMethodsExportedByRouteFile(r.filePath) : [m];
            for (const method of methods) {
                const files = byMethod.get(method) ?? [];
                files.push(r.filePath);
                byMethod.set(method, files);
            }
        }
        for (const [method, files] of byMethod) {
            if (files.length > 1) {
                throw new Error(`Duplicate handler for method ${method}.\nKeep only one method per route:\n ${files.join("\n")}`);
            }
        }
    }
}
export function getRouteTable(appDir) {
    let table = cache.get(appDir);
    if (!table) {
        table = scanAppFiles(getRoutesDir(appDir));
        cache.set(appDir, table);
    }
    return table;
}
/** Radix tree for O(path depth) route lookup. Cached per appDir. */
export function getRadixTree(appDir) {
    let tree = radixCache.get(appDir);
    if (!tree) {
        tree = buildRadixTree(getRouteTable(appDir));
        radixCache.set(appDir, tree);
    }
    return tree;
}
/** Per-method radix tree (find-my-way style): one tree per HTTP method, direct filePath in match. Cached per appDir+method. */
export function getRadixTreeForMethod(appDir, method) {
    const key = `${appDir}\0${method}`;
    let tree = radixPerMethodCache.get(key);
    if (!tree) {
        tree = buildRadixTreeForMethod(getRouteTable(appDir), method);
        radixPerMethodCache.set(key, tree);
    }
    return tree;
}
/** Add or refresh routes for a single route file and update radix caches lazily. */
export function addRouteFileToTable(appDir, filePath) {
    const table = getRouteTable(appDir);
    const target = resolve(filePath);
    const dir = dirname(target);
    const routesDir = getRoutesDir(appDir);
    const scanned = scanRouteFilesInDir(routesDir, dir).filter((r) => resolve(r.filePath) === target);
    if (scanned.length === 0)
        return;
    // Merge new entries into the existing table, avoiding duplicates.
    for (const r of scanned) {
        const exists = table.some((e) => resolve(e.filePath) === resolve(r.filePath) &&
            (e.method ?? "") === (r.method ?? "") &&
            e.pathname === r.pathname);
        if (!exists)
            table.push(r);
    }
    cache.set(appDir, table);
    // Invalidate radix trees for this appDir; they will rebuild on next access.
    radixCache.delete(appDir);
    for (const key of radixPerMethodCache.keys()) {
        if (key.startsWith(appDir + "\0"))
            radixPerMethodCache.delete(key);
    }
}
/** Remove all routes coming from a specific route file and invalidate radix caches. */
export function removeRouteFileFromTable(appDir, filePath) {
    const target = resolve(filePath);
    const table = getRouteTable(appDir).filter((r) => resolve(r.filePath) !== target);
    cache.set(appDir, table);
    radixCache.delete(appDir);
    for (const key of radixPerMethodCache.keys()) {
        if (key.startsWith(appDir + "\0"))
            radixPerMethodCache.delete(key);
    }
}
export function clearRouteTableCache(appDir) {
    if (appDir) {
        cache.delete(appDir);
        radixCache.delete(appDir);
        for (const k of radixPerMethodCache.keys()) {
            if (k.startsWith(appDir + "\0"))
                radixPerMethodCache.delete(k);
        }
    }
    else {
        cache.clear();
        radixCache.clear();
        radixPerMethodCache.clear();
    }
}
//# sourceMappingURL=routeTable.js.map