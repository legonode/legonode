import type { ScannedRoute } from "../loader/fileScanner.js";
export type MatchResult = {
    routeId: string;
    /** Method -> file path. "" = route.ts (all methods). GET, POST, etc. = get.ts, post.ts. */
    fileByMethod: Record<string, string>;
    /** Catch-all [[...x]] params are string[], others are string. */
    params: Record<string, string | string[]>;
};
export declare function matchRoute(method: string, pathname: string, routes: ScannedRoute[]): MatchResult | null;
//# sourceMappingURL=matcher.d.ts.map