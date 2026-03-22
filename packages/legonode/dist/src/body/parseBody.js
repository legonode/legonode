const DEFAULT_MAX_BODY_SIZE = 1_000_000; // 1MB
const PAYLOAD_TOO_LARGE = new Error("Payload too large");
function readStream(req, maxSize) {
    return new Promise((resolve, reject) => {
        const contentLength = req.headers["content-length"];
        const length = contentLength ? parseInt(contentLength, 10) : null;
        if (length !== null && (isNaN(length) || length < 0 || length > maxSize)) {
            reject(PAYLOAD_TOO_LARGE);
            return;
        }
        if (length === 0) {
            resolve(Buffer.allocUnsafe(0));
            return;
        }
        if (length !== null && length <= maxSize) {
            const buf = Buffer.allocUnsafe(length);
            let offset = 0;
            req.on("data", (chunk) => {
                const toCopy = Math.min(chunk.length, length - offset);
                chunk.copy(buf, offset, 0, toCopy);
                offset += toCopy;
                if (offset > maxSize) {
                    req.destroy();
                    reject(PAYLOAD_TOO_LARGE);
                }
            });
            req.on("end", () => resolve(buf.subarray(0, offset)));
            req.on("error", reject);
            return;
        }
        const chunks = [];
        let total = 0;
        req.on("data", (chunk) => {
            total += chunk.length;
            if (total > maxSize) {
                req.destroy();
                reject(PAYLOAD_TOO_LARGE);
                return;
            }
            chunks.push(chunk);
        });
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
    });
}
function parseJson(buf) {
    if (buf.length === 0)
        return null;
    const raw = buf.toString("utf-8");
    return JSON.parse(raw);
}
function parseUrlEncoded(buf) {
    if (buf.length === 0)
        return {};
    const raw = buf.toString("utf-8");
    const out = {};
    for (const pair of raw.split("&")) {
        const eq = pair.indexOf("=");
        if (eq === -1) {
            out[decodeURIComponent(pair.replace(/\+/g, " "))] = "";
        }
        else {
            const key = decodeURIComponent(pair.slice(0, eq).replace(/\+/g, " "));
            const value = decodeURIComponent(pair.slice(eq + 1).replace(/\+/g, " "));
            out[key] = value;
        }
    }
    return out;
}
function getContentType(req) {
    const raw = req.headers["content-type"];
    if (!raw || typeof raw !== "string")
        return null;
    const part = raw.split(";")[0];
    return part ? part.trim().toLowerCase() : null;
}
export async function parseBody(req, maxBodySize = DEFAULT_MAX_BODY_SIZE) {
    const method = (req.method ?? "GET").toUpperCase();
    if (method === "GET" || method === "HEAD") {
        return { ok: true, body: null };
    }
    const contentLength = req.headers["content-length"];
    if (contentLength === "0" || contentLength === undefined) {
        return { ok: true, body: null };
    }
    let buffer;
    try {
        buffer = await readStream(req, maxBodySize);
    }
    catch (err) {
        const message = err === PAYLOAD_TOO_LARGE ? "Payload too large" : "Bad request";
        return { ok: false, status: 413, body: { error: message } };
    }
    const contentType = getContentType(req);
    if (!contentType || buffer.length === 0) {
        return { ok: true, body: null };
    }
    if (contentType === "application/json") {
        try {
            const body = parseJson(buffer);
            return { ok: true, body };
        }
        catch {
            return { ok: false, status: 400, body: { error: "Invalid JSON" } };
        }
    }
    if (contentType === "application/x-www-form-urlencoded") {
        const body = parseUrlEncoded(buffer);
        return { ok: true, body };
    }
    return { ok: true, body: buffer };
}
//# sourceMappingURL=parseBody.js.map