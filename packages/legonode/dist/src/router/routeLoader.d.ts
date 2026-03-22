import type { RouteSchema, ResponseSchemaMap } from "../validation/routeSchema.js";
export type RouteHandler = (ctx: unknown) => unknown | Promise<unknown>;
/**
 * Load a route file (e.g. route.ts) and return which HTTP methods it actually exports
 * (named export GET/POST/... or default that is a function).
 */
export declare function getMethodsExportedByRouteFile(filePath: string): Promise<string[]>;
export type LoadedRoute = {
    routeId: string;
    handler: RouteHandler;
    schema?: RouteSchema;
    methodSchema?: RouteSchema;
    responseSchema?: ResponseSchemaMap;
};
export declare function loadRoute(filePath: string, method: string, routeId: string): Promise<LoadedRoute | null>;
export declare function reloadRoutes({ currentDir, changedPath, fileExists, filename, }: {
    currentDir: string;
    changedPath: string;
    fileExists: boolean;
    filename: string;
}): Promise<void>;
//# sourceMappingURL=routeLoader.d.ts.map