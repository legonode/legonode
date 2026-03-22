import { getMiddlewarePathsForPathname } from "./middlewareTable.js";
import { loadMiddlewareFromFile } from "./middlewareLoader.js";
const middlewareCache = new Map();
function middlewareCacheKey(appDir, pathname, method) {
    return `${appDir}\0${pathname}\0${method}`;
}
function isPromise(v) {
    return typeof v?.then === "function";
}
export function createMiddlewareResolver(appDir) {
    return {
        resolveForPathname(pathname, method) {
            const key = middlewareCacheKey(appDir, pathname, method);
            const cached = middlewareCache.get(key);
            if (cached !== undefined && !isPromise(cached))
                return cached;
            let promise;
            if (cached !== undefined && isPromise(cached)) {
                promise = cached;
            }
            else {
                promise = (async () => {
                    const paths = getMiddlewarePathsForPathname(pathname, appDir);
                    const all = [];
                    for (const filePath of paths) {
                        const fns = await loadMiddlewareFromFile(filePath, method);
                        all.push(...fns);
                    }
                    return all;
                })();
                middlewareCache.set(key, promise);
            }
            return promise.then((arr) => {
                middlewareCache.set(key, arr);
                return arr;
            });
        }
    };
}
const resolverCache = new Map();
export function clearMiddlewareResolverCache(appDir) {
    if (appDir !== undefined) {
        resolverCache.delete(appDir);
        const prefix = appDir + "\0";
        for (const key of middlewareCache.keys()) {
            if (key.startsWith(prefix))
                middlewareCache.delete(key);
        }
    }
    else {
        resolverCache.clear();
        middlewareCache.clear();
    }
}
export function getOrCreateMiddlewareResolver(appDir) {
    let r = resolverCache.get(appDir);
    if (!r) {
        r = createMiddlewareResolver(appDir);
        resolverCache.set(appDir, r);
    }
    return r;
}
/** Pathname + method pairs to preload (e.g. from route table). */
export async function preloadMiddleware(appDir, pathnameMethodPairs) {
    const resolver = getOrCreateMiddlewareResolver(appDir);
    const promises = pathnameMethodPairs.map(({ pathname, method }) => {
        const result = resolver.resolveForPathname(pathname, method);
        return Array.isArray(result) ? Promise.resolve(result) : result;
    });
    await Promise.all(promises);
}
//# sourceMappingURL=middlewareResolver.js.map