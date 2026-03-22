import fastJsonStringify from "fast-json-stringify";
function isZodType(v) {
    return (v != null &&
        typeof v === "object" &&
        "safeParse" in v &&
        typeof v.safeParse === "function");
}
function isSimpleSchemaShape(part) {
    return typeof part === "object" && part !== null && !isZodType(part);
}
function simpleTypeToJsonSchema(value) {
    const optional = value.endsWith("?");
    const type = (optional ? value.slice(0, -1) : value);
    const schema = type === "object" || type === "array" ? { type: type } : { type };
    return { schema, optional };
}
function simpleShapeToJsonSchema(shape) {
    const properties = {};
    const required = [];
    for (const [key, value] of Object.entries(shape)) {
        if (typeof value === "string") {
            const { schema, optional } = simpleTypeToJsonSchema(value);
            properties[key] = schema;
            if (!optional)
                required.push(key);
        }
        else if (typeof value === "object" && value !== null && !isZodType(value)) {
            properties[key] = simpleShapeToJsonSchema(value);
            required.push(key);
        }
    }
    const out = {
        type: "object",
        additionalProperties: false
    };
    if (Object.keys(properties).length > 0)
        out.properties = properties;
    if (required.length > 0)
        out.required = required;
    return out;
}
const serializerCache = new Map();
function cacheKey(schema) {
    return JSON.stringify(schema);
}
function getCachedSerializer(jsonSchema) {
    const key = cacheKey(jsonSchema);
    let fn = serializerCache.get(key);
    if (!fn) {
        try {
            const stringify = fastJsonStringify(jsonSchema);
            fn = (data) => stringify(data);
            serializerCache.set(key, fn);
        }
        catch {
            fn = (data) => JSON.stringify(data);
            serializerCache.set(key, fn);
        }
    }
    return fn;
}
/**
 * Returns a fast serializer for the given status when the response schema is a SimpleSchemaShape.
 * Returns null when no schema or Zod schema (fall back to JSON.stringify).
 */
export function getStringifier(responseSchema, status) {
    const part = responseSchema?.[status];
    if (part == null || !isSimpleSchemaShape(part))
        return null;
    const jsonSchema = simpleShapeToJsonSchema(part);
    return getCachedSerializer(jsonSchema);
}
//# sourceMappingURL=fastStringify.js.map