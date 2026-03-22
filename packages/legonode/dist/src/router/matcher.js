export function matchRoute(method, pathname, routes) {
    const urlSegments = pathname.replace(/^\/+/, "").split("/").filter(Boolean);
    for (const route of routes) {
        const patternSegments = route.pathname.replace(/^\/+/, "").split("/").filter(Boolean);
        const params = {};
        let i = 0;
        let j = 0;
        let match = true;
        while (i < patternSegments.length && j < urlSegments.length) {
            const rawSeg = patternSegments[i];
            if (rawSeg === undefined) {
                match = false;
                break;
            }
            const seg = rawSeg;
            // Route groups: (main) – ignore in URL structure
            if (seg.startsWith("(") && seg.endsWith(")")) {
                i += 1;
                continue;
            }
            const urlSeg = urlSegments[j] ?? "";
            // Optional catch-all: [[...all]]
            const catchAllMatch = seg.match(/^\[\[\.\.\.(.+)\]\]$/);
            if (catchAllMatch) {
                const name = catchAllMatch[1];
                params[name] = decodeURIComponent(urlSegments.slice(j).join("/"));
                // catch-all must be the last pattern segment
                i = patternSegments.length;
                j = urlSegments.length;
                break;
            }
            // Dynamic segment: [id]
            const dynMatch = seg.match(/^\[(.+)\]$/);
            if (dynMatch) {
                const name = dynMatch[1];
                params[name] = decodeURIComponent(urlSeg);
                i += 1;
                j += 1;
                continue;
            }
            // Static segment
            if (seg !== urlSeg) {
                match = false;
                break;
            }
            i += 1;
            j += 1;
        }
        // Skip remaining route groups at the end
        while (i < patternSegments.length) {
            const seg = patternSegments[i];
            if (!seg || !(seg.startsWith("(") && seg.endsWith(")")))
                break;
            i += 1;
        }
        const hasExtraUrlSegments = j < urlSegments.length;
        const hasUnmatchedPatternSegments = i < patternSegments.length;
        if (!match || hasExtraUrlSegments || hasUnmatchedPatternSegments)
            continue;
        const fileByMethod = route.method ? { [route.method]: route.filePath } : { "": route.filePath };
        return {
            routeId: route.pathname,
            fileByMethod,
            params
        };
    }
    return null;
}
//# sourceMappingURL=matcher.js.map