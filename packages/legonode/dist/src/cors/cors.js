const DEFAULT_METHODS = ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"];
const DEFAULT_HEADERS = ["content-type", "authorization", "accept"];
function getRequestOrigin(req) {
    const raw = req.headers.origin;
    if (typeof raw === "string")
        return raw;
    if (Array.isArray(raw))
        return raw[0] ?? null;
    return null;
}
function isOriginAllowed(config, req) {
    const origin = getRequestOrigin(req);
    const cfg = config.origin || [];
    if (!origin) {
        // Non-browser or same-origin requests usually don't send Origin.
        return true;
    }
    if (cfg === undefined || cfg === true) {
        return true;
    }
    if (typeof cfg === "string") {
        return cfg === origin;
    }
    if (Array.isArray(cfg)) {
        return cfg.includes(origin);
    }
    return false;
}
function resolveOrigin(config, req) {
    const origin = getRequestOrigin(req);
    if (!isOriginAllowed(config, req))
        return null;
    const cfg = config.origin;
    if (cfg === undefined || cfg === true) {
        return origin;
    }
    if (cfg === false) {
        return null;
    }
    if (typeof cfg === "string") {
        return cfg;
    }
    if (Array.isArray(cfg)) {
        // Allowed when list contains request origin.
        return origin;
    }
    return null;
}
export function shouldRejectCorsRequest(cors, req) {
    const config = typeof cors === "boolean" ? {} : cors;
    const origin = getRequestOrigin(req);
    if (!origin)
        return false;
    return !isOriginAllowed(config, req);
}
export function getCorsHeaders(cors, req) {
    const config = typeof cors === "boolean" ? {} : cors;
    const allowOrigin = resolveOrigin(config, req);
    if (!allowOrigin)
        return {};
    const headers = {
        "Access-Control-Allow-Origin": allowOrigin
    };
    const methods = config.methods ?? DEFAULT_METHODS;
    headers["Access-Control-Allow-Methods"] = Array.isArray(methods) ? methods.join(", ") : methods;
    const allowedHeaders = config.allowedHeaders ?? DEFAULT_HEADERS;
    headers["Access-Control-Allow-Headers"] = Array.isArray(allowedHeaders)
        ? allowedHeaders.join(", ")
        : allowedHeaders;
    if (config.credentials === true) {
        headers["Access-Control-Allow-Credentials"] = "true";
    }
    return headers;
}
//# sourceMappingURL=cors.js.map