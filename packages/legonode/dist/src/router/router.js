import { dirname, relative, resolve } from "node:path";
import { getRadixTreeForMethod, getRouteTable, addRouteFileToTable } from "./routeTable.js";
import { loadRoute } from "./routeLoader.js";
const routeCache = new Map();
/** Cached resolved route for static routes (no params). */
const staticResolvedCache = new Map();
function routeCacheKey(appDir, filePath, method) {
    return `${appDir}\0${filePath}\0${method}`;
}
function isPromise(v) {
    return typeof v?.then === "function";
}
function getMiddlewarePathFromFile(appDir, filePath) {
    const routerBase = resolve(appDir, "router");
    const routeDir = dirname(resolve(filePath));
    const rel = relative(routerBase, routeDir).replace(/\\/g, "/");
    if (!rel || rel === ".")
        return "/";
    return "/" + rel;
}
/**
 * Resolve route using per-method radix tree (find-my-way style): one tree per HTTP method,
 * direct filePath from match, no method map lookup.
 */
export function resolveRoute(method, pathname, appDir) {
    const tree = getRadixTreeForMethod(appDir, method);
    const match = tree.match(pathname);
    if (!match)
        return null;
    const key = routeCacheKey(appDir, match.filePath, method);
    const middlewarePath = getMiddlewarePathFromFile(appDir, match.filePath);
    const cached = routeCache.get(key);
    if (cached !== undefined && !isPromise(cached)) {
        if (!cached)
            return null;
        const paramCount = Object.keys(match.params).length;
        if (paramCount === 0) {
            let resolved = staticResolvedCache.get(key);
            if (!resolved) {
                resolved = {
                    route: cached,
                    params: Object.create(null),
                    middlewarePath
                };
                staticResolvedCache.set(key, resolved);
            }
            return resolved;
        }
        return { route: cached, params: match.params, middlewarePath };
    }
    let loadPromise;
    if (cached !== undefined && isPromise(cached)) {
        loadPromise = cached;
    }
    else {
        loadPromise = loadRoute(match.filePath, method, match.routeId);
        routeCache.set(key, loadPromise);
    }
    return loadPromise.then((loaded) => {
        routeCache.set(key, loaded);
        if (!loaded)
            return null;
        return { route: loaded, params: match.params, middlewarePath };
    });
}
/** Preload all routes and warm per-method radix trees so resolveRoute is sync. */
export async function preloadRoutes(appDir) {
    const table = getRouteTable(appDir);
    const byPath = new Map();
    const methodsToWarm = new Set();
    for (const r of table) {
        let fileByMethod = byPath.get(r.pathname);
        if (!fileByMethod) {
            fileByMethod = {};
            byPath.set(r.pathname, fileByMethod);
        }
        const m = r.method ?? "";
        fileByMethod[m] = r.filePath;
        if (m)
            methodsToWarm.add(m);
        else {
            methodsToWarm.add("");
            methodsToWarm.add("GET");
            methodsToWarm.add("POST");
            methodsToWarm.add("PUT");
            methodsToWarm.add("PATCH");
            methodsToWarm.add("DELETE");
            methodsToWarm.add("HEAD");
            methodsToWarm.add("OPTIONS");
        }
    }
    const promises = [];
    for (const [pathname, fileByMethod] of byPath) {
        for (const [method, filePath] of Object.entries(fileByMethod)) {
            // route.ts (method "") exports GET, POST, etc. per method — only cache under "" so we load with the real HTTP method on first request
            const keys = method === "" ? [""] : [method];
            const key = routeCacheKey(appDir, filePath, keys[0]);
            if (routeCache.has(key))
                continue;
            const p = loadRoute(filePath, method, pathname);
            for (const m of keys)
                routeCache.set(routeCacheKey(appDir, filePath, m), p);
            promises.push(p.then((loaded) => {
                for (const m of keys)
                    routeCache.set(routeCacheKey(appDir, filePath, m), loaded);
            }));
        }
    }
    await Promise.all(promises);
    for (const method of methodsToWarm) {
        getRadixTreeForMethod(appDir, method);
    }
}
const ALL_METHODS = ["", "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
/** Reload handler cache for the given route file (dev hot reload). */
export async function reloadRoute(appDir, filePath) {
    const table = getRouteTable(appDir);
    const resolvedTarget = resolve(filePath);
    const entries = table.filter((r) => resolve(r.filePath) === resolvedTarget);
    if (entries.length === 0) {
        // New route file not yet in the route table: add it and rebuild caches lazily.
        addRouteFileToTable(appDir, filePath);
        return;
    }
    const filePathForKey = entries[0].filePath;
    const methodsToClear = new Set();
    for (const r of entries) {
        const m = r.method ?? "";
        if (m)
            methodsToClear.add(m);
        else
            ALL_METHODS.forEach((x) => methodsToClear.add(x));
    }
    for (const m of methodsToClear) {
        const key = routeCacheKey(appDir, filePathForKey, m);
        routeCache.delete(key);
        staticResolvedCache.delete(key);
    }
    const promises = [];
    const seen = new Set();
    for (const r of entries) {
        const method = r.method ?? "";
        const keys = method === "" ? [""] : [method];
        const cacheKey = routeCacheKey(appDir, filePathForKey, keys[0]);
        if (seen.has(cacheKey))
            continue;
        seen.add(cacheKey);
        const p = loadRoute(r.filePath, method, r.pathname);
        for (const m of keys)
            routeCache.set(routeCacheKey(appDir, filePathForKey, m), p);
        promises.push(p.then((loaded) => {
            for (const m of keys)
                routeCache.set(routeCacheKey(appDir, filePathForKey, m), loaded);
        }));
    }
    await Promise.all(promises);
}
//# sourceMappingURL=router.js.map