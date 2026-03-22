/** Thrown when middleware calls next(err); request handler catches and passes to errorHandler */
export class NextError extends Error {
    error;
    constructor(error) {
        super("next(err) called");
        this.error = error;
        this.name = "NextError";
    }
}
export async function runMiddlewareStack(ctx, middleware, handler) {
    let idx = -1;
    async function dispatch(i) {
        if (i <= idx)
            throw new Error("next() called multiple times");
        idx = i;
        const fn = middleware[i];
        if (!fn)
            return handler();
        await fn(ctx, (err) => {
            if (err !== undefined && err !== null)
                throw new NextError(err);
            return dispatch(i + 1);
        });
    }
    await dispatch(0);
}
//# sourceMappingURL=middlewareRunner.js.map