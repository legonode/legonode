import { z } from "zod";
/** Simple type descriptor. Add "?" for optional: "string?", "number?", "boolean?" */
export type SimpleType = "string" | "number" | "boolean" | "object" | "array";
/** Shape for body, params, or query: field name -> simple type string or nested object. */
export interface SimpleSchemaShape {
    [key: string]: SimpleType | string | SimpleSchemaShape;
}
/** Per-key schema: either a simple shape (converted to Zod) or a Zod schema. */
export type SchemaPart = SimpleSchemaShape | z.ZodTypeAny;
/** Route schema: validate body (only for methods that send body), params, query. */
export type RouteSchema = {
    body?: SchemaPart;
    params?: SchemaPart;
    query?: SchemaPart;
};
/** Per-method overrides. Merged on top of SCHEMA for the current method. */
export type MethodSchemaMap = Partial<Record<string, RouteSchema>>;
/** Response body schema per status code. Enforced before sending so only allowed shapes are sent. */
export type ResponseSchemaMap = Partial<Record<number, SchemaPart>>;
/** Infer TypeScript type from a simple shape (e.g. { id: "string", name: "string" } -> { id: string; name: string }). */
export type InferSimpleShape<T> = T extends Record<string, SimpleType | string | SimpleSchemaShape> ? {
    [K in keyof T]: InferSimpleValue<T[K]>;
} : never;
/** Map simple type strings to TS types. Supports "string?", "number?", etc. */
export type InferSimpleValue<V> = V extends "string" ? string : V extends "number" ? number : V extends "boolean" ? boolean : V extends "object" ? object : V extends "array" ? unknown[] : V extends "string?" ? string | undefined : V extends "number?" ? number | undefined : V extends "boolean?" ? boolean | undefined : V extends "object?" ? object | undefined : V extends "array?" ? unknown[] | undefined : V extends SimpleSchemaShape ? InferSimpleShape<V> : unknown;
/** Infer response body types from a response schema map (Zod or simple shapes) for use with Context<T>. */
export type InferResponseBodies<S extends ResponseSchemaMap> = {
    [K in keyof S]: S[K] extends z.ZodTypeAny ? z.infer<S[K]> : S[K] extends SimpleSchemaShape ? InferSimpleShape<S[K]> : unknown;
};
/** Merge local route response schema with default (config) schema. Local overrides default for same status. */
export type MergedResponseBodies<Local extends ResponseSchemaMap, Default extends ResponseSchemaMap = Record<number, never>> = Omit<InferResponseBodies<Default>, keyof Local> & InferResponseBodies<Local>;
export type ResponseValidationResult = {
    ok: true;
} | {
    ok: false;
    details: unknown;
};
/** Validate response body against a schema (e.g. from config.responses[200] or GET_RESPONSE_SCHEMA[201]). */
export declare function validateResponseBody(schema: SchemaPart, data: unknown): ResponseValidationResult;
/** Merge method overrides onto base. Method schema wins for each key (body, params, query). */
export declare function mergeRouteSchema(base: RouteSchema | undefined, methodOverride: RouteSchema | undefined): RouteSchema;
export type ValidationResult = {
    ok: true;
    body?: unknown;
    params?: Record<string, string | string[]>;
    query?: Record<string, string>;
} | {
    ok: false;
    status: number;
    json: {
        error: string;
        details?: unknown;
    };
};
/** Thrown when route validation fails; request handler sends status + json. */
export declare class ValidationError extends Error {
    readonly status: number;
    readonly json: {
        error: string;
        details?: unknown;
    };
    constructor(status: number, json: {
        error: string;
        details?: unknown;
    });
}
/**
 * Validate ctx against the merged route schema.
 * Body is only validated when method is POST, PUT, or PATCH.
 */
export declare function validateRoute(schema: RouteSchema, method: string, ctx: {
    body: unknown;
    params: Record<string, string | string[]>;
    query: Record<string, string>;
}): ValidationResult;
export { z };
//# sourceMappingURL=routeSchema.d.ts.map