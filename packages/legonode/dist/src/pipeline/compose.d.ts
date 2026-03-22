import type { LegonodeContext } from "../core/context.js";
import type { Middleware } from "../middleware/middlewareRunner.js";
export type PipelineHandler = (ctx: LegonodeContext) => unknown | Promise<unknown>;
/**
 * Compose middleware + handler into a single pipeline function (no loop at request time).
 * Builds a chain: mw1(ctx, () => mw2(ctx, () => ... () => handler(ctx))).
 * Returns sync when handler (and chain) returns sync to avoid extra microtasks.
 */
export declare function compose(middleware: Middleware[], handler: PipelineHandler): (ctx: LegonodeContext) => unknown | Promise<unknown>;
//# sourceMappingURL=compose.d.ts.map