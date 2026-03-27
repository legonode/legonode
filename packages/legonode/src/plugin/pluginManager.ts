import type { LegonodePlugin } from "./pluginAPI.js";
type HookMap = Map<keyof LegonodePlugin, Array<(...args: unknown[]) => unknown | Promise<unknown>>>;

function buildHookMap(plugins: LegonodePlugin[]): HookMap {
  const map: HookMap = new Map();
  for (const plugin of plugins) {
    for (const [k, v] of Object.entries(plugin) as Array<[keyof LegonodePlugin, unknown]>) {
      if (k === "name" || typeof v !== "function") continue;
      const list = map.get(k);
      if (list) list.push(v as (...args: unknown[]) => unknown | Promise<unknown>);
      else map.set(k, [v as (...args: unknown[]) => unknown | Promise<unknown>]);
    }
  }
  return map;
}

export function createPluginManager(plugins: LegonodePlugin[] = []) {
  const hasPlugins = plugins.length > 0;
  const hookMap = hasPlugins ? buildHookMap(plugins) : new Map();
  return {
    plugins,
    async runHook(hook: keyof LegonodePlugin, ...args: unknown[]) {
      if (!hasPlugins) return;
      const hooks = hookMap.get(hook);
      if (!hooks || hooks.length === 0) return;
      for (const fn of hooks) {
        await fn(...(args as unknown[]));
      }
    }
  };
}

