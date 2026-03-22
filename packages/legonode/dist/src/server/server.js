import { createServer } from "node:http";
import { handleNodeRequest, warmRuntime, } from "./requestHandler.js";
import { getRequestHandlerOptionsFromConfig, } from "../config/loadConfig.js";
import { getRouteTable } from "../router/routeTable.js";
import { appLogger } from "../utils/logger.js";
export function createNodeServer(options = {}) {
    const port = options.port ?? 3000;
    const hostname = options.hostname ?? "127.0.0.1";
    let isListening = false;
    const server = createServer((req, res) => {
        handleNodeRequest(req, res, options);
    });
    async function listen() {
        if (isListening)
            return;
        await warmRuntime(options);
        return new Promise((resolve, reject) => {
            if (isListening)
                return;
            server.listen(port);
            server.once("listening", () => {
                isListening = true;
                options.onListen?.({ port, hostname });
                resolve();
            });
            server.once("error", (err) => {
                if (err.code === "EADDRINUSE") {
                    appLogger.error(`Port ${port} is already in use`);
                    resolve();
                }
                else {
                    reject(err);
                }
            });
        });
    }
    async function close() {
        if (!isListening)
            return;
        return new Promise((resolve, reject) => {
            server.close((err) => {
                isListening = false;
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    return {
        server,
        listen,
        close,
        isListening,
    };
}
export function setupServer(config, cwd, appDir, port, host) {
    try {
        getRouteTable(appDir);
        return createNodeServer({
            ...getRequestHandlerOptionsFromConfig(config, cwd, { appDir }),
            port,
            hostname: host,
            onListen: ({ hostname, port: p }) => {
                appLogger.info(`legonode dev listening on http://${hostname}:${p}`);
            },
        });
    }
    catch (error) {
        appLogger.error("Failed to setup server\n", error.message);
    }
    return null;
}
//# sourceMappingURL=server.js.map