import type { IncomingMessage } from "node:http";
import type { CorsConfig } from "../config/loadConfig.js";
export declare function shouldRejectCorsRequest(cors: CorsConfig | boolean, req: IncomingMessage): boolean;
export declare function getCorsHeaders(cors: CorsConfig | boolean, req: IncomingMessage): Record<string, string>;
//# sourceMappingURL=cors.d.ts.map