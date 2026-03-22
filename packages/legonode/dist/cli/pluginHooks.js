export async function runPluginHook(plugins, hook, ...args) {
    if (!plugins || plugins.length === 0)
        return;
    for (const plugin of plugins) {
        const fn = plugin[hook];
        if (typeof fn === "function") {
            await fn(...args);
        }
    }
}
//# sourceMappingURL=pluginHooks.js.map