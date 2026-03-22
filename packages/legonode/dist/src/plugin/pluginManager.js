export function createPluginManager(plugins = []) {
    const hasPlugins = plugins.length > 0;
    return {
        plugins,
        async runHook(hook, ...args) {
            if (!hasPlugins)
                return;
            for (const plugin of plugins) {
                const fn = plugin[hook];
                if (typeof fn === "function")
                    await fn(...args);
            }
        }
    };
}
//# sourceMappingURL=pluginManager.js.map