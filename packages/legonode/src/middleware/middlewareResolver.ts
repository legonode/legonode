import type { Middleware } from "./middlewareRunner.js";
import { getMiddlewarePathsForPathname } from "./middlewareTable.js";
import { loadMiddlewareFromFile } from "./middlewareLoader.js";

type CachedMiddleware = Middleware[] | Promise<Middleware[]>;

const middlewareCache = new Map<string, CachedMiddleware>();

function middlewareCacheKey(appDir: string, pathname: string, method: string): string {
  return `${appDir}\0${pathname}\0${method}`;
}

function isPromise(v: CachedMiddleware): v is Promise<Middleware[]> {
  return typeof (v as Promise<Middleware[]>)?.then === "function";
}

export type MiddlewareResolver = {
  resolveForPathname: (pathname: string, method: string) => Middleware[] | Promise<Middleware[]>;
};

export function createMiddlewareResolver(appDir: string): MiddlewareResolver {
  return {
    resolveForPathname(pathname: string, method: string): Middleware[] | Promise<Middleware[]> {      const key = middlewareCacheKey(appDir, pathname, method);
      const cached = middlewareCache.get(key);
      if (cached !== undefined && !isPromise(cached)) return cached;
      let promise: Promise<Middleware[]>;
      if (cached !== undefined && isPromise(cached)) {
        promise = cached;
      } else {
        promise = (async () => {
          const paths = getMiddlewarePathsForPathname(pathname, appDir);
          const all: Middleware[] = [];
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

const resolverCache = new Map<string, MiddlewareResolver>();

export function clearMiddlewareResolverCache(appDir?: string): void {
  if (appDir !== undefined) {
    resolverCache.delete(appDir);
    const prefix = appDir + "\0";
    for (const key of middlewareCache.keys()) {
      if (key.startsWith(prefix)) middlewareCache.delete(key);
    }
  } else {
    resolverCache.clear();
    middlewareCache.clear();
  }
}

export function getOrCreateMiddlewareResolver(appDir: string): MiddlewareResolver {
  let r = resolverCache.get(appDir);
  if (!r) {
    r = createMiddlewareResolver(appDir);
    resolverCache.set(appDir, r);
  }
  return r;
}

/** Pathname + method pairs to preload (e.g. from route table). */
export async function preloadMiddleware(
  appDir: string,
  pathnameMethodPairs: Array<{ pathname: string; method: string }>
): Promise<void> {
  const resolver = getOrCreateMiddlewareResolver(appDir);
  const promises = pathnameMethodPairs.map(({ pathname, method }) => {
    const result = resolver.resolveForPathname(pathname, method);
    return Array.isArray(result) ? Promise.resolve(result) : result;
  });
  await Promise.all(promises);
}
