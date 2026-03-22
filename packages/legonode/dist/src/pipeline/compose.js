/** True if value is thenable (has .then). */
function isThenable(v) {
    return v != null && typeof v.then === "function";
}
/**
 * Compose middleware + handler into a single pipeline function (no loop at request time).
 * Builds a chain: mw1(ctx, () => mw2(ctx, () => ... () => handler(ctx))).
 * Returns sync when handler (and chain) returns sync to avoid extra microtasks.
 */
export function compose(middleware, handler) {
    if (middleware.length === 0) {
        return (ctx) => handler(ctx);
    }
    let fn = (ctx) => handler(ctx);
    for (let i = middleware.length - 1; i >= 0; i--) {
        const mw = middleware[i];
        const next = fn;
        fn = (ctx) => new Promise((resolve, reject) => {
            const nextCb = (err) => {
                if (err !== undefined && err !== null)
                    return Promise.reject(err);
                const ret = next(ctx);
                if (isThenable(ret))
                    return ret.then(resolve, reject);
                resolve(ret);
                return Promise.resolve();
            };
            const ret = mw(ctx, nextCb);
            if (isThenable(ret))
                ret.then(() => { }, reject);
        });
    }
    return fn;
}
//# sourceMappingURL=compose.js.map