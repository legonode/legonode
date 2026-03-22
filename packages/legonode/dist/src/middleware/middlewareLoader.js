import { pathToFileURL } from "node:url";
import { invalidateModuleCache } from "../loader/moduleCache.js";
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
function toMiddlewareArray(raw) {
    if (!Array.isArray(raw))
        return [];
    return raw.filter((fn) => typeof fn === "function");
}
export async function loadMiddlewareFromFile(filePath, method) {
    try {
        const bust = process.env.LEGONODE_MIDDLEWARE_RELOAD_TOKEN;
        if (bust)
            invalidateModuleCache(filePath);
        const url = pathToFileURL(filePath).href;
        const importUrl = bust ? `${url}?t=${bust}` : url;
        const mod = await import(importUrl);
        const all = toMiddlewareArray(mod.default);
        const methodKey = `${method}_middleware`;
        if (METHODS.includes(method) && mod[methodKey] != null) {
            all.push(...toMiddlewareArray(mod[methodKey]));
        }
        return all;
    }
    catch {
        return [];
    }
}
//# sourceMappingURL=middlewareLoader.js.map