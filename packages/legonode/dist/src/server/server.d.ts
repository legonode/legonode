import type { IncomingMessage, ServerResponse } from "node:http";
import { type RequestHandlerOptions } from "./requestHandler.js";
import { type LegonodeConfig } from "../config/loadConfig.js";
export type NodeServerOptions = RequestHandlerOptions & {
    port?: number;
    hostname?: string;
    onListen?: (info: {
        port: number;
        hostname: string;
    }) => void;
    appDir?: string;
};
export declare function createNodeServer(options?: NodeServerOptions): {
    server: import("http").Server<typeof IncomingMessage, typeof ServerResponse>;
    listen: () => Promise<void>;
    close: () => Promise<void>;
    isListening: boolean;
};
export declare function setupServer(config: LegonodeConfig, cwd: string, appDir: string, port: number, host: string): ReturnType<typeof createNodeServer> | null;
//# sourceMappingURL=server.d.ts.map