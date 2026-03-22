import type { LegonodeLogger } from "../logger/requestLogger.js";
import { getBaseLogger } from "../logger/requestLogger.js";

export type EventEmitterFn = (name: string, payload?: unknown) => void;

/** Context passed to event handlers for tracing and logging. Ties event execution to the request that emitted it. */
export type EventContext = {
  /** Trace id of the request that emitted the event (empty when emitted outside a request, e.g. cron). */
  traceId: string;
  /** Logger with traceId in bindings so logs from the handler correlate with the API call. */
  logger: LegonodeLogger;
  /** Event name (e.g. "user.created"). */
  eventName: string;
};

export type EventHandler = (payload: unknown, ctx: EventContext) => void | Promise<void>;

export type EventBus = {
  on: (name: string, handler: EventHandler) => void;
  /** Emit with optional event context (set by framework when called from request ctx.emit). */
  emit: (name: string, payload?: unknown, eventCtx?: EventContext) => void;
};

function defaultEventContext(eventName: string): EventContext {
  return {
    traceId: "",
    logger: getBaseLogger().child({ eventName }),
    eventName
  };
}

export function createEventBus(): EventBus {
  const handlers = new Map<string, EventHandler[]>();

  return {
    on: (name, handler) => {
      const list = handlers.get(name) ?? [];
      list.push(handler);
      handlers.set(name, list);
    },
    emit: (name, payload, eventCtx) => {
      const list = handlers.get(name) ?? [];
      if (list.length === 0) {
        console.warn(`[Event] event not found: "${name}"`);
        return;
      }
      const ctx = eventCtx ?? defaultEventContext(name);
      for (const handler of list) void handler(payload, ctx);
    }
  };
}

