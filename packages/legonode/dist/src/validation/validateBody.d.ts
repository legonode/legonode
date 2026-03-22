import type { LegonodeContext } from "../core/context.js";
/**
 * Validate ctx.body with a parse function (e.g. Zod schema's .parse).
 * Returns the parsed value on success; throws on failure (error handler can send 400).
 */
export declare function validateBody<T>(ctx: LegonodeContext, parse: (body: unknown) => T): T;
//# sourceMappingURL=validateBody.d.ts.map