import type { EventBus } from "./eventBus.js";
export declare function getOrCreateEventBus(appDir: string): Promise<EventBus>;
export declare function clearEventBusCache(appDir?: string): void;
export declare function registerEventHandlersFromApp(bus: EventBus, appDir: string): Promise<void>;
//# sourceMappingURL=eventExecutor.d.ts.map