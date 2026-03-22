import type { ScannedMiddleware } from "../loader/fileScanner.js";
import { scanMiddlewareFiles } from "../loader/fileScanner.js";

const cache = new Map<string, ScannedMiddleware[]>();

export function getMiddlewareTable(appDir: string): ScannedMiddleware[] {
  let table = cache.get(appDir);
  if (!table) {
    table = scanMiddlewareFiles(appDir);
    cache.set(appDir, table);
  }
  return table;
}

/** Pathname e.g. /api/hello -> path prefixes ["", "api", "api/hello"] */
function pathnameToPrefixes(pathname: string): string[] {
  const normalized = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  if (!normalized) return [""];
  const segments = normalized.split("/").filter(Boolean);
  const prefixes: string[] = [""];
  let acc = "";
  for (const s of segments) {
    acc = acc ? `${acc}/${s}` : s;
    prefixes.push(acc);
  }
  return prefixes;
}

/** Ordered list of middleware file paths for this pathname (ancestor first). Uses exact pathPrefix so group middleware (e.g. api/(user)) only runs for routes inside that group. */
export function getMiddlewarePathsForPathname(pathname: string, appDir: string): string[] {
  const table = getMiddlewareTable(appDir);
  const prefixes = pathnameToPrefixes(pathname);
  const paths: string[] = [];
  for (const p of prefixes) {
    for (const m of table) {
      if (m.pathPrefix === p) paths.push(m.filePath);
    }
  }
  return paths;
}

export function clearMiddlewareTableCache(appDir?: string): void {
  if (appDir) cache.delete(appDir);
  else cache.clear();
}
