import type { LegonodePlugin } from "../src/plugin/pluginAPI.js";
type HookName = keyof LegonodePlugin;
export declare function runPluginHook(plugins: LegonodePlugin[] | undefined, hook: HookName, ...args: unknown[]): Promise<void>;
export {};
//# sourceMappingURL=pluginHooks.d.ts.map