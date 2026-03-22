export type TraceRecord = {
    route?: string;
    totalMs?: number;
};
export type TraceStore = {
    add: (record: TraceRecord) => void;
    list: () => TraceRecord[];
};
export declare function createInMemoryTraceStore(): TraceStore;
//# sourceMappingURL=traceStore.d.ts.map