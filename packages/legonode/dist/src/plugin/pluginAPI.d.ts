import type { LegonodeContext } from "../core/context.js";
export type LegonodeCommandName = "dev" | "build" | "start";
export type LegonodeCommandHookContext = {
    command: LegonodeCommandName;
    cwd: string;
    appDir?: string;
    host?: string;
    port?: number;
    buildPath?: string;
    reason?: string;
    filename?: string;
    changedPath?: string;
    fileExists?: boolean;
    fileType?: "route" | "middleware" | "cron" | "event" | "other";
    name?: string;
    source?: "manual" | "scheduler";
    payload?: unknown;
    error?: unknown;
};
export type LegonodePlugin = {
    name: string;
    onRequest?: (ctx: LegonodeContext) => void | Promise<void>;
    onRouteMatch?: (ctx: LegonodeContext) => void | Promise<void>;
    onMiddlewareResolved?: (ctx: LegonodeContext, info: {
        pathname: string;
        method: string;
        count: number;
    }) => void | Promise<void>;
    onEventEmit?: (ctx: LegonodeContext, info: {
        name: string;
        payload?: unknown;
    }) => void | Promise<void>;
    onCronRun?: (ctx: LegonodeContext | undefined, info: {
        name: string;
        payload?: unknown;
        source: "manual" | "scheduler";
    }) => void | Promise<void>;
    onCronError?: (ctx: LegonodeContext | undefined, info: {
        name: string;
        payload?: unknown;
        source: "manual" | "scheduler";
        error: unknown;
    }) => void | Promise<void>;
    beforeHandler?: (ctx: LegonodeContext) => void | Promise<void>;
    afterHandler?: (ctx: LegonodeContext, result: unknown) => void | Promise<void>;
    /** Runs before any response is sent (headers can still be set). */
    beforeResponse?: (ctx: LegonodeContext) => void | Promise<void>;
    /** Runs after the response has been sent (in finally block). */
    afterResponse?: (ctx: LegonodeContext) => void | Promise<void>;
    onError?: (ctx: LegonodeContext, error: unknown) => void | Promise<void>;
    onDevStart?: (ctx: LegonodeCommandHookContext) => void | Promise<void>;
    onDevFileChange?: (ctx: LegonodeCommandHookContext) => void | Promise<void>;
    onDevRestart?: (ctx: LegonodeCommandHookContext) => void | Promise<void>;
    onDevStop?: (ctx: LegonodeCommandHookContext) => void | Promise<void>;
    onBuildStart?: (ctx: LegonodeCommandHookContext) => void | Promise<void>;
    onBuildComplete?: (ctx: LegonodeCommandHookContext) => void | Promise<void>;
    onBuildError?: (ctx: LegonodeCommandHookContext) => void | Promise<void>;
    onStartStart?: (ctx: LegonodeCommandHookContext) => void | Promise<void>;
    onStartListening?: (ctx: LegonodeCommandHookContext) => void | Promise<void>;
    onStartStop?: (ctx: LegonodeCommandHookContext) => void | Promise<void>;
    onStartError?: (ctx: LegonodeCommandHookContext) => void | Promise<void>;
};
//# sourceMappingURL=pluginAPI.d.ts.map