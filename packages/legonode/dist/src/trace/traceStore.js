export function createInMemoryTraceStore() {
    const records = [];
    return {
        add: (record) => {
            records.push(record);
        },
        list: () => records.slice()
    };
}
//# sourceMappingURL=traceStore.js.map