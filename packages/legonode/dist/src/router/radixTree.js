function parsePatternSegments(pathname) {
    const raw = pathname.replace(/^\/+/, "").split("/").filter(Boolean);
    const out = [];
    for (const seg of raw) {
        if (seg.startsWith("(") && seg.endsWith(")"))
            continue;
        const catchAll = seg.match(/^\[\[\.\.\.(.+)\]\]$/);
        if (catchAll) {
            out.push({ type: "catchAll", param: catchAll[1] });
            break;
        }
        const dynamic = seg.match(/^\[(.+)\]$/);
        if (dynamic) {
            out.push({ type: "dynamic", param: dynamic[1] });
            continue;
        }
        out.push({ type: "static", value: seg });
    }
    return out;
}
function createNode() {
    return {};
}
/** Insert a route into the tree. */
function insert(node, segments, payload) {
    let n = node;
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (seg.type === "catchAll") {
            n.catchAll = { param: seg.param, route: payload };
            return;
        }
        if (seg.type === "static") {
            if (!n.static)
                n.static = new Map();
            let next = n.static.get(seg.value);
            if (!next) {
                next = createNode();
                n.static.set(seg.value, next);
            }
            n = next;
            continue;
        }
        if (seg.type === "dynamic") {
            if (!n.dynamic)
                n.dynamic = { param: seg.param, node: createNode() };
            n = n.dynamic.node;
            continue;
        }
    }
    n.route = payload;
}
/**
 * Build a radix tree from scanned routes. Groups by pathname and merges method-specific files (get.ts, post.ts) with route.ts.
 */
export function buildRadixTree(routes) {
    const byPath = new Map();
    for (const r of routes) {
        const pathname = r.pathname;
        let fileByMethod = byPath.get(pathname);
        if (!fileByMethod) {
            fileByMethod = {};
            byPath.set(pathname, fileByMethod);
        }
        fileByMethod[r.method ?? ""] = r.filePath;
    }
    const root = createNode();
    for (const [pathname, fileByMethod] of byPath) {
        const segments = parsePatternSegments(pathname);
        const payload = { routeId: pathname, fileByMethod };
        insert(root, segments, payload);
    }
    function match(pathname) {
        const urlSegments = pathname.replace(/^\/+/, "").split("/").filter(Boolean);
        const params = {};
        function walk(n, segIndex) {
            if (segIndex === urlSegments.length) {
                if (n.route) {
                    const result = { routeId: n.route.routeId, fileByMethod: n.route.fileByMethod, params: { ...params } };
                    return result;
                }
                return null;
            }
            const seg = urlSegments[segIndex] ?? "";
            if (n.static) {
                const next = n.static.get(seg);
                if (next) {
                    const result = walk(next, segIndex + 1);
                    if (result)
                        return result;
                }
            }
            if (n.dynamic) {
                params[n.dynamic.param] = decodeURIComponent(seg);
                const result = walk(n.dynamic.node, segIndex + 1);
                if (result)
                    return result;
                delete params[n.dynamic.param];
            }
            if (n.catchAll) {
                params[n.catchAll.param] = urlSegments.slice(segIndex).map(decodeURIComponent);
                const result = {
                    routeId: n.catchAll.route.routeId,
                    fileByMethod: n.catchAll.route.fileByMethod,
                    params: { ...params }
                };
                return result;
            }
            return null;
        }
        return walk(root, 0);
    }
    return { match };
}
function createNodePerMethod() {
    return {};
}
function insertPerMethod(node, segments, payload) {
    let n = node;
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (seg.type === "catchAll") {
            n.catchAll = { param: seg.param, route: payload };
            return;
        }
        if (seg.type === "static") {
            if (!n.static)
                n.static = new Map();
            let next = n.static.get(seg.value);
            if (!next) {
                next = createNodePerMethod();
                n.static.set(seg.value, next);
            }
            n = next;
            continue;
        }
        if (seg.type === "dynamic") {
            if (!n.dynamic)
                n.dynamic = { param: seg.param, node: createNodePerMethod() };
            n = n.dynamic.node;
            continue;
        }
    }
    n.route = payload;
}
/**
 * Build a radix tree for a single HTTP method (find-my-way style).
 * Lookup is O(path depth) with no method map; returns filePath directly.
 */
export function buildRadixTreeForMethod(routes, method) {
    const byPath = new Map();
    for (const r of routes) {
        const pathname = r.pathname;
        let fileByMethod = byPath.get(pathname);
        if (!fileByMethod) {
            fileByMethod = {};
            byPath.set(pathname, fileByMethod);
        }
        fileByMethod[r.method ?? ""] = r.filePath;
    }
    const root = createNodePerMethod();
    for (const [pathname, fileByMethod] of byPath) {
        const filePath = fileByMethod[method] ?? fileByMethod[""];
        if (!filePath)
            continue;
        const segments = parsePatternSegments(pathname);
        insertPerMethod(root, segments, { routeId: pathname, filePath });
    }
    function match(pathname) {
        const urlSegments = pathname.replace(/^\/+/, "").split("/").filter(Boolean);
        const params = {};
        function walk(n, segIndex) {
            if (segIndex === urlSegments.length) {
                if (n.route)
                    return { routeId: n.route.routeId, filePath: n.route.filePath, params: { ...params } };
                return null;
            }
            const seg = urlSegments[segIndex] ?? "";
            if (n.static) {
                const next = n.static.get(seg);
                if (next) {
                    const result = walk(next, segIndex + 1);
                    if (result)
                        return result;
                }
            }
            if (n.dynamic) {
                params[n.dynamic.param] = decodeURIComponent(seg);
                const result = walk(n.dynamic.node, segIndex + 1);
                if (result)
                    return result;
                delete params[n.dynamic.param];
            }
            if (n.catchAll) {
                params[n.catchAll.param] = urlSegments.slice(segIndex).map(decodeURIComponent);
                return {
                    routeId: n.catchAll.route.routeId,
                    filePath: n.catchAll.route.filePath,
                    params: { ...params }
                };
            }
            return null;
        }
        return walk(root, 0);
    }
    return { match };
}
//# sourceMappingURL=radixTree.js.map