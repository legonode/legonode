import { getBaseLogger } from "../logger/requestLogger.js";
function defaultEventContext(eventName) {
    return {
        traceId: "",
        logger: getBaseLogger().child({ eventName }),
        eventName
    };
}
export function createEventBus() {
    const handlers = new Map();
    return {
        on: (name, handler) => {
            const list = handlers.get(name) ?? [];
            list.push(handler);
            handlers.set(name, list);
        },
        emit: (name, payload, eventCtx) => {
            const list = handlers.get(name) ?? [];
            if (list.length === 0) {
                console.warn(`[Event] event not found: "${name}"`);
                return;
            }
            const ctx = eventCtx ?? defaultEventContext(name);
            for (const handler of list)
                void handler(payload, ctx);
        }
    };
}
//# sourceMappingURL=eventBus.js.map