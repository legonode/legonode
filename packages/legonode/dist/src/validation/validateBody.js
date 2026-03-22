/**
 * Validate ctx.body with a parse function (e.g. Zod schema's .parse).
 * Returns the parsed value on success; throws on failure (error handler can send 400).
 */
export function validateBody(ctx, parse) {
    return parse(ctx.body);
}
//# sourceMappingURL=validateBody.js.map