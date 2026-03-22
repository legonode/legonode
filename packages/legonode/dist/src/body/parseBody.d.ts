import type { IncomingMessage } from "node:http";
export type ParseBodyResult = {
    ok: true;
    body: unknown;
} | {
    ok: false;
    status: number;
    body: unknown;
};
export declare function parseBody(req: IncomingMessage, maxBodySize?: number): Promise<ParseBodyResult>;
//# sourceMappingURL=parseBody.d.ts.map