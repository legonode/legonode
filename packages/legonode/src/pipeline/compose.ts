import type { LegonodeContext } from "../core/context.js";
import type { Middleware } from "../middleware/middlewareRunner.js";

export type PipelineHandler = (ctx: LegonodeContext) => unknown | Promise<unknown>;

/** True if value is thenable (has .then). */
function isThenable(v: unknown): v is Promise<unknown> {
  return v != null && typeof (v as Promise<unknown>).then === "function";
}

/**
 * Compose middleware + handler into a single pipeline function (no loop at request time).
 * Builds a chain: mw1(ctx, () => mw2(ctx, () => ... () => handler(ctx))).
 * Returns sync when handler (and chain) returns sync to avoid extra microtasks.
 */
export function compose(
  middleware: Middleware[],
  handler: PipelineHandler,
): (ctx: LegonodeContext) => unknown | Promise<unknown> {
  if (middleware.length === 0) {
    return (ctx: LegonodeContext) => handler(ctx);
  }

  let fn: (ctx: LegonodeContext) => unknown | Promise<unknown> = (ctx: LegonodeContext) =>
    handler(ctx);

  for (let i = middleware.length - 1; i >= 0; i--) {
    const mw = middleware[i]!;
    const next = fn;
    fn = (ctx: LegonodeContext) =>
      new Promise((resolve, reject) => {
        const nextCb = (err?: unknown): Promise<void> => {
          if (err !== undefined && err !== null) return Promise.reject(err) as Promise<void>;
          const ret = next(ctx);
          if (isThenable(ret)) return ret.then(resolve, reject) as Promise<void>;
          resolve(ret);
          return Promise.resolve();
        };
        const ret = mw(ctx, nextCb);
        if (isThenable(ret)) (ret as Promise<unknown>).then(() => {}, reject);
      });
  }

  return fn;
}
