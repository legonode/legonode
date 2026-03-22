export function defaultErrorHandler({ logger }, err) {
    if (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        const status = err.status ?? 500;
        logger.error(err);
        return { status, json: { error: message } };
    }
    return { status: 500, json: { error: "Internal Server Error" } };
}
//# sourceMappingURL=errorHandler.js.map