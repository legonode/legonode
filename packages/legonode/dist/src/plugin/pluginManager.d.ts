import type { LegonodePlugin } from "./pluginAPI.js";
export declare function createPluginManager(plugins?: LegonodePlugin[]): {
    plugins: LegonodePlugin[];
    runHook(hook: keyof LegonodePlugin, ...args: unknown[]): Promise<void>;
};
//# sourceMappingURL=pluginManager.d.ts.map