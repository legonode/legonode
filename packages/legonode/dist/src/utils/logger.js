import { inspect } from "node:util";
function formatArg(arg) {
    if (typeof arg === "string")
        return arg;
    return inspect(arg, {
        colors: true,
        depth: 8,
        compact: false,
        breakLength: 100,
        sorted: true,
    });
}
function formatArgs(args) {
    return args.map((arg) => formatArg(arg)).join(" ");
}
export const appLogger = {
    info: (...args) => console.log(formatArgs(args)),
    warn: (...args) => console.warn(formatArgs(args)),
    error: (...args) => console.error(formatArgs(args)),
};
//# sourceMappingURL=logger.js.map