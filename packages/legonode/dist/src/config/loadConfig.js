import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import { appLogger } from "../utils/logger.js";
export async function loadConfig(cwd) {
    const candidates = ["legonode.config.ts", "legonode.config.js", "legonode.config.mjs"];
    for (const name of candidates) {
        const configPath = resolve(cwd, name);
        try {
            if (name.endsWith(".ts")) {
                try {
                    // @ts-expect-error - tsx/esm has no types; registers loader for .ts
                    await import("tsx/esm");
                }
                catch {
                    continue;
                }
            }
            const url = pathToFileURL(configPath).href;
            const mod = await import(url);
            const config = mod.default ?? mod;
            return typeof config === "object" && config !== null ? config : {};
        }
        catch (error) {
            continue;
        }
    }
    return {};
}
export function getAppDir(config, cwd) {
    // Default app directory layout:
    // - routes live under `${appDir}/router/**`
    // - other runtime features (events/schedules/middleware/etc.) use `${appDir}`
    try {
        const appDir = config.appDir ?? "./src";
        const routerDir = resolve(appDir);
        if (existsSync(routerDir)) {
            return routerDir;
        }
        throw new Error();
    }
    catch (error) {
        appLogger.error("App directory not found: ", config.appDir);
        return;
    }
    // const raw = config.appDir ?? "./src";
    // return raw.startsWith("/") ? raw : resolve(cwd, raw);
}
export function getBuildPath(config, cwd) {
    const raw = config.buildPath ?? "./dist";
    return raw.startsWith("/") ? raw : resolve(cwd, raw);
}
export function getRequestHandlerOptionsFromConfig(config, cwd, overrides) {
    const appDir = overrides?.appDir ?? getAppDir(config, cwd);
    const out = { appDir: appDir || "" };
    if (config.maxBodySize !== undefined)
        out.maxBodySize = config.maxBodySize;
    if (config.errorHandler !== undefined)
        out.errorHandler = config.errorHandler;
    if (config.cors !== undefined)
        out.cors = config.cors;
    if (config.plugins !== undefined)
        out.plugins = config.plugins;
    if (config.responses !== undefined)
        out.responses = config.responses;
    if (config.logger !== undefined)
        out.logger = config.logger;
    if (config.dev !== undefined)
        out.dev = config.dev;
    if (config.tracing !== undefined)
        out.tracing = config.tracing;
    if (config.tracer !== undefined)
        out.tracer = config.tracer;
    if (config.traceStart !== undefined)
        out.traceStart = config.traceStart;
    return out;
}
//# sourceMappingURL=loadConfig.js.map