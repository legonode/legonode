import type { IncomingMessage, ServerResponse } from "node:http";
import { type LegonodeContext } from "./context.js";
import type { EventBus } from "../events/eventBus.js";
import type { LegonodePlugin } from "../plugin/pluginAPI.js";
import type { TracerFn, TraceStartFn } from "../trace/traceEngine.js";
import type { ScheduleRunnerFn } from "../schedules/scheduleLoader.js";
export type RuntimeOptions = {
    appDir?: string | undefined;
    plugins?: LegonodePlugin[];
    eventBus?: EventBus;
    scheduleRunner?: ScheduleRunnerFn;
    tracer?: TracerFn;
    traceStart?: TraceStartFn;
    /** When false, disable tracer/traceStart callbacks (default: true). Logger always has traceId for correlation. */
    tracing?: boolean;
    /** When true, reuse context objects from a pool (can reduce GC; enable for long-lived servers with many routes). */
    contextPool?: boolean;
};
export declare function createRuntime(options?: RuntimeOptions): {
    createRequestContext: (req: IncomingMessage, res: ServerResponse) => LegonodeContext;
    events: EventBus;
    hasPlugins: boolean;
    contextPool: boolean;
    tracing: boolean;
    runHook: (hook: keyof LegonodePlugin, ...args: unknown[]) => Promise<void>;
};
export type Runtime = ReturnType<typeof createRuntime>;
//# sourceMappingURL=runtime.d.ts.map