import { z } from "zod";
/** Validate response body against a schema (e.g. from config.responses[200] or GET_RESPONSE_SCHEMA[201]). */
export function validateResponseBody(schema, data) {
    const zodSchema = toZodSchema(schema);
    const parsed = zodSchema.safeParse(data);
    if (parsed.success)
        return { ok: true };
    return { ok: false, details: parsed.error.flatten() };
}
const BODY_METHODS = new Set(["POST", "PUT", "PATCH"]);
function isZodType(v) {
    return v != null && typeof v === "object" && "safeParse" in v && typeof v.safeParse === "function";
}
function parseSimpleType(s) {
    const optional = s.endsWith("?");
    const type = (optional ? s.slice(0, -1) : s);
    return { type, optional };
}
function simpleToZod(value) {
    if (typeof value === "string") {
        const { type, optional } = parseSimpleType(value);
        let schema;
        switch (type) {
            case "string":
                schema = z.string();
                break;
            case "number":
                schema = z.coerce.number();
                break;
            case "boolean":
                schema = z.coerce.boolean();
                break;
            case "object":
                schema = z.record(z.unknown());
                break;
            case "array":
                schema = z.array(z.unknown());
                break;
            default:
                schema = z.unknown();
        }
        return optional ? schema.optional() : schema;
    }
    if (typeof value === "object" && value !== null && !isZodType(value)) {
        const shape = {};
        for (const [k, v] of Object.entries(value)) {
            shape[k] = simpleToZod(v);
        }
        return z.object(shape);
    }
    return z.unknown();
}
function toZodSchema(part) {
    if (isZodType(part))
        return part;
    return simpleToZod(part);
}
/** Merge method overrides onto base. Method schema wins for each key (body, params, query). */
export function mergeRouteSchema(base, methodOverride) {
    if (!methodOverride)
        return base ?? {};
    if (!base)
        return methodOverride;
    const body = methodOverride.body ?? base.body;
    const params = methodOverride.params ?? base.params;
    const query = methodOverride.query ?? base.query;
    const out = {};
    if (body !== undefined)
        out.body = body;
    if (params !== undefined)
        out.params = params;
    if (query !== undefined)
        out.query = query;
    return out;
}
/** Thrown when route validation fails; request handler sends status + json. */
export class ValidationError extends Error {
    status;
    json;
    constructor(status, json) {
        super("Validation failed");
        this.status = status;
        this.json = json;
        this.name = "ValidationError";
    }
}
/**
 * Validate ctx against the merged route schema.
 * Body is only validated when method is POST, PUT, or PATCH.
 */
export function validateRoute(schema, method, ctx) {
    const validateBody = BODY_METHODS.has(method);
    const result = { ok: true };
    const queryObj = ctx.query;
    if (schema.body && validateBody) {
        const bodySchema = toZodSchema(schema.body);
        const parsed = bodySchema.safeParse(ctx.body);
        if (!parsed.success) {
            return {
                ok: false,
                status: 400,
                json: { error: "Validation failed", details: parsed.error.flatten() }
            };
        }
        result.body = parsed.data;
    }
    if (schema.params) {
        const paramsSchema = toZodSchema(schema.params);
        const parsed = paramsSchema.safeParse(ctx.params);
        if (!parsed.success) {
            return {
                ok: false,
                status: 400,
                json: { error: "Invalid params", details: parsed.error.flatten() }
            };
        }
        result.params = parsed.data;
    }
    if (schema.query) {
        const querySchema = toZodSchema(schema.query);
        const parsed = querySchema.safeParse(queryObj);
        if (!parsed.success) {
            return {
                ok: false,
                status: 400,
                json: { error: "Invalid query", details: parsed.error.flatten() }
            };
        }
        result.query = parsed.data;
    }
    return result;
}
export { z };
//# sourceMappingURL=routeSchema.js.map