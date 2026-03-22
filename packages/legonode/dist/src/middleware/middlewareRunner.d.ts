import type { LegonodeContext } from "../core/context.js";
export type Next = (err?: unknown) => Promise<void>;
export type Middleware = (ctx: LegonodeContext, next: Next) => Promise<void> | void;
/** Thrown when middleware calls next(err); request handler catches and passes to errorHandler */
export declare class NextError extends Error {
    readonly error: unknown;
    constructor(error: unknown);
}
export declare function runMiddlewareStack(ctx: LegonodeContext, middleware: Middleware[], handler: () => Promise<void>): Promise<void>;
//# sourceMappingURL=middlewareRunner.d.ts.map