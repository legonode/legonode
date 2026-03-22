import type { ResponseSchemaMap } from "../validation/routeSchema.js";
/**
 * Returns a fast serializer for the given status when the response schema is a SimpleSchemaShape.
 * Returns null when no schema or Zod schema (fall back to JSON.stringify).
 */
export declare function getStringifier(responseSchema: ResponseSchemaMap | undefined, status: number): ((data: unknown) => string) | null;
//# sourceMappingURL=fastStringify.d.ts.map