import type { IncomingMessage, ServerResponse } from "node:http";

import { getContext, type LegonodeContext } from "./context.js";
import { createTraceSpan } from "../trace/traceEngine.js";
import { createRequestLogger } from "../logger/requestLogger.js";
import { createEventBus } from "../events/eventBus.js";
import type { EventBus } from "../events/eventBus.js";
import { createPluginManager } from "../plugin/pluginManager.js";
import type { LegonodePlugin } from "../plugin/pluginAPI.js";
import type { TracerFn, TraceData, TraceStartFn, TraceStartData } from "../trace/traceEngine.js";
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

export function createRuntime(options: RuntimeOptions = {}) {
  const events = options.eventBus ?? createEventBus();
  const scheduleRunner: ScheduleRunnerFn = options.scheduleRunner ?? (() => {});
  const plugins = options.plugins ?? [];
  const pluginManager = createPluginManager(plugins);
  const useTracing =
    options.tracing !== false &&
    process.env.LEGONODE_SKIP_TRACING !== "1" &&
    process.env.LEGONODE_SKIP_TRACING !== "true";
  const tracer = useTracing ? options.tracer : undefined;
  const traceStart = useTracing ? options.traceStart : undefined;
  const hasPlugins = plugins.length > 0;
  const contextPool = options.contextPool === true;

  function createRequestContext(req: IncomingMessage, res: ServerResponse) {
    const beforeSend = hasPlugins
      ? (ctx: LegonodeContext) => pluginManager.runHook("beforeResponse", ctx)
      : undefined;
    const ctx = getContext(req, res, contextPool, beforeSend);
    const requestTraceStart: TraceStartFn | undefined =
      traceStart
        ? (data: TraceStartData) => {
            traceStart(data);
            ctx.log.state.push({
              level: "info",
              args: [{ method: data.method, pathname: data.pathname }, "request started"],
              timestamp: data.startTime
            });
          }
        : undefined;
    const requestTracer: TracerFn | undefined =
      tracer
        ? (data: TraceData) => {
            tracer(data);
            ctx.log.state.push({
              level: "info",
              args: [
                {
                  method: data.method,
                  pathname: data.pathname,
                  ...(data.statusCode != null && { statusCode: data.statusCode }),
                  durationMs: data.durationMs,
                  ...(data.routeId != null && { routeId: data.routeId }),
                  ...(data.responseSize != null && { responseSize: data.responseSize }),
                  ...(data.error != null && { error: data.error })
                },
                "request completed"
              ],
              timestamp: data.endTime
            });
          }
        : undefined;
    const span = createTraceSpan(requestTracer, requestTraceStart);
    ctx.log.state = [];
    ctx.logger = createRequestLogger(span.traceId, undefined, ctx.log.state);
    ctx.trace = { get traceId() { return span.traceId; } };
    ctx.__traceSpan = span;
    ctx.emit = (name, payload) => {
      if (hasPlugins) {
        void pluginManager.runHook("onEventEmit", ctx, { name, payload });
      }
      events.emit(name, payload, {
        traceId: span.traceId,
        logger: ctx.logger,
        eventName: name
      });
    };
    ctx.schedule = (name, payload) => {
      if (hasPlugins) {
        void pluginManager.runHook("onCronRun", ctx, {
          name,
          payload,
          source: "manual"
        });
      }
      const result = scheduleRunner(name, payload);
      if (result && typeof (result as Promise<void>).then === "function") {
        return (result as Promise<void>).catch((error) => {
          if (hasPlugins) {
            void pluginManager.runHook("onCronError", ctx, {
              name,
              payload,
              source: "manual",
              error
            });
          }
          throw error;
        });
      }
      return result;
    };
    return ctx;
  }

  return {
    createRequestContext,
    events,
    hasPlugins,
    contextPool,
    tracing: useTracing,
    runHook: pluginManager.runHook.bind(pluginManager)
  };
}

export type Runtime = ReturnType<typeof createRuntime>;

