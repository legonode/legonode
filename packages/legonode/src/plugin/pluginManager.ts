import type { LegonodePlugin } from "./pluginAPI.js";

type PluginHook = ((...args: unknown[]) => unknown | Promise<unknown>) | undefined;

export function createPluginManager(plugins: LegonodePlugin[] = []) {
  const hasPlugins = plugins.length > 0;
  return {
    plugins,
    async runHook(hook: keyof LegonodePlugin, ...args: unknown[]) {
      if (!hasPlugins) return;
      for (const plugin of plugins) {
        const fn = plugin[hook] as PluginHook;
        if (typeof fn === "function") await fn(...(args as unknown[]));
      }
    }
  };
}

