import { getNoopLogger } from "../logger/requestLogger.js";
/** Pick default status when handler does not call res.status(): prefer 200, then 201, then 204; else 200. */
export function getDefaultStatusFromSchema(schema) {
    if (!schema || typeof schema !== "object")
        return 200;
    const keys = Object.keys(schema)
        .map(Number)
        .filter((k) => !Number.isNaN(k));
    if (keys.length === 0)
        return 200;
    if (keys.includes(200))
        return 200;
    if (keys.includes(201))
        return 201;
    if (keys.includes(204))
        return 204;
    return 200;
}
function createLegonodeResponse(nodeRes, defaultStatusRef, responseSizeRef, beforeSend, ctxRef) {
    const state = {
        nodeRes,
        defaultStatusRef,
        responseSizeRef,
        sent: false,
        explicitStatus: null,
        headers: Object.create(null),
    };
    function effectiveStatus() {
        return state.explicitStatus ?? state.defaultStatusRef.current;
    }
    function applyHeaders() {
        for (const [k, v] of Object.entries(state.headers)) {
            state.nodeRes.setHeader(k, String(v));
        }
    }
    function doSend(body) {
        state.sent = true;
        if (state.responseSizeRef) {
            state.responseSizeRef.current =
                body === undefined ? 0 : Buffer.isBuffer(body) ? body.length : typeof body === "string" ? Buffer.byteLength(body) : body.length;
        }
        state.nodeRes.statusCode = effectiveStatus();
        applyHeaders();
        if (body !== undefined) {
            state.nodeRes.end(Buffer.isBuffer(body) ? body : typeof body === "string" ? body : Buffer.from(body));
        }
        else {
            state.nodeRes.end();
        }
    }
    function end(body) {
        if (state.sent)
            return;
        if (beforeSend && ctxRef?.current) {
            const c = ctxRef;
            return (async () => {
                await beforeSend(c.current);
                if (state.sent)
                    return;
                doSend(body);
            })();
        }
        doSend(body);
    }
    function sendJson(data) {
        if (state.sent)
            return;
        state.nodeRes.setHeader("content-type", "application/json; charset=utf-8");
        return end(JSON.stringify(data));
    }
    const chain = {
        json(data) {
            return sendJson(data);
        },
        send(body) {
            return end(body);
        },
        text(body) {
            if (state.sent)
                return;
            state.nodeRes.setHeader("content-type", "text/plain; charset=utf-8");
            return end(body);
        },
        html(body) {
            if (state.sent)
                return;
            state.nodeRes.setHeader("content-type", "text/html; charset=utf-8");
            return end(body);
        }
    };
    function doRedirect(url, code) {
        state.explicitStatus = code;
        if (state.responseSizeRef)
            state.responseSizeRef.current = 0;
        state.nodeRes.setHeader("location", url);
        applyHeaders();
        state.sent = true;
        state.nodeRes.statusCode = effectiveStatus();
        state.nodeRes.end();
    }
    function redirect(url, code = 302) {
        if (state.sent)
            return;
        if (beforeSend && ctxRef?.current) {
            const c = ctxRef;
            return (async () => {
                await beforeSend(c.current);
                if (state.sent)
                    return;
                doRedirect(url, code);
            })();
        }
        doRedirect(url, code);
    }
    function doStream(readable) {
        state.sent = true;
        if (state.responseSizeRef)
            state.responseSizeRef.current = 0;
        state.nodeRes.statusCode = effectiveStatus();
        applyHeaders();
        readable.pipe(state.nodeRes);
    }
    function stream(readable) {
        if (state.sent)
            return;
        if (beforeSend && ctxRef?.current) {
            const c = ctxRef;
            return (async () => {
                await beforeSend(c.current);
                if (state.sent)
                    return;
                doStream(readable);
            })();
        }
        doStream(readable);
    }
    const res = {
        get raw() {
            return state.nodeRes;
        },
        status(code) {
            state.explicitStatus = code;
            return chain;
        },
        get headers() {
            return state.headers;
        },
        setHeader(name, value) {
            state.headers[name.toLowerCase()] = value;
        },
        send(body) {
            return end(body);
        },
        html(body) {
            if (state.sent)
                return;
            state.nodeRes.setHeader("content-type", "text/html; charset=utf-8");
            return end(body);
        },
        json(data) {
            return sendJson(data);
        },
        text(body) {
            if (state.sent)
                return;
            state.nodeRes.setHeader("content-type", "text/plain; charset=utf-8");
            return end(body);
        },
        redirect,
        stream,
        get sent() {
            return state.sent;
        },
        get statusCode() {
            return effectiveStatus();
        },
        reinit(n, d, r) {
            state.nodeRes = n;
            state.defaultStatusRef = d;
            state.responseSizeRef = r;
            state.sent = false;
            state.explicitStatus = null;
            for (const k of Object.keys(state.headers))
                delete state.headers[k];
        }
    };
    return res;
}
const ctxPool = [];
const EMPTY_PARAMS = Object.create(null);
/** Parse query string to a plain object (no URLSearchParams allocation; null prototype). */
function parseQuery(search) {
    const obj = Object.create(null);
    if (!search.length)
        return obj;
    let start = 0;
    while (start < search.length) {
        const eq = search.indexOf("=", start);
        const amp = search.indexOf("&", start);
        const end = amp === -1 ? search.length : amp;
        const key = decodeURIComponent(search.slice(start, eq === -1 ? end : eq).replace(/\+/g, " "));
        const value = eq === -1 || eq >= end
            ? ""
            : decodeURIComponent(search.slice(eq + 1, end).replace(/\+/g, " "));
        if (key.length)
            obj[key] = value;
        start = amp === -1 ? search.length : amp + 1;
    }
    return obj;
}
function parseQueryFromReq(req) {
    const raw = req.url ?? "/";
    const i = raw.indexOf("?");
    const search = i === -1 ? "" : raw.slice(i + 1);
    return parseQuery(search);
}
function allocContext(req, res, beforeSend) {
    const responseSchemaRef = {};
    const defaultStatusRef = { current: 200 };
    const responseSizeRef = { current: 0 };
    const ctxRef = { current: null };
    const ctx = {
        req,
        res: createLegonodeResponse(res, defaultStatusRef, responseSizeRef, beforeSend, ctxRef),
        __responseSchemaRef: responseSchemaRef,
        __defaultStatusRef: defaultStatusRef,
        __responseSizeRef: responseSizeRef,
        params: Object.create(null),
        get query() {
            if (ctx.__queryCache === undefined) {
                ctx.__queryCache = parseQueryFromReq(ctx.req);
            }
            return ctx.__queryCache;
        },
        set query(v) {
            ctx.__queryCache = v;
        },
        body: null,
        state: Object.create(null),
        emit: () => { },
        schedule: () => { },
        logger: getNoopLogger(),
        log: { state: [] },
        trace: { get traceId() { return ""; } },
        __ctxRef: ctxRef,
    };
    ctxRef.current = ctx;
    return ctx;
}
function reinitContext(ctx, req, res, beforeSend) {
    const defaultStatusRef = ctx.__defaultStatusRef;
    const responseSizeRef = ctx.__responseSizeRef;
    defaultStatusRef.current = 200;
    responseSizeRef.current = 0;
    ctx.req = req;
    if (ctx.__ctxRef)
        ctx.__ctxRef.current = ctx;
    if (ctx.res.reinit) {
        ctx.res.reinit(res, defaultStatusRef, responseSizeRef);
    }
    else {
        const ctxRef = ctx.__ctxRef ?? { current: ctx };
        ctx.res = createLegonodeResponse(res, defaultStatusRef, responseSizeRef, beforeSend, ctxRef);
    }
    ctx.params = Object.create(null);
    ctx.body = null;
    delete ctx.__queryCache;
    ctx.state = Object.create(null);
    ctx.log.state = [];
    return ctx;
}
/** Get context from pool or create new. Use releaseContext(ctx) in finally when done. When usePool is false, always alloc (faster hot path for hello-world). */
export function getContext(req, res, usePool = false, beforeSend) {
    if (!usePool)
        return allocContext(req, res, beforeSend);
    const recycled = ctxPool.pop();
    if (recycled)
        return reinitContext(recycled, req, res, beforeSend);
    return allocContext(req, res, beforeSend);
}
/** Return context to pool. Call in request handler finally. Keeps ctx.res for reuse via reinit. */
export function releaseContext(ctx) {
    ctx.req = null;
    ctx.params = EMPTY_PARAMS;
    ctx.body = null;
    delete ctx.__queryCache;
    ctx.state = Object.create(null);
    ctx.log.state = [];
    ctxPool.push(ctx);
}
/** Get a request context (from pool when possible). Same as getContext; exported for backwards compatibility. */
export const createContext = getContext;
//# sourceMappingURL=context.js.map