export type ScheduledTask = {
    name: string;
    cron: string;
    run: () => Promise<void> | void;
};
export declare function createScheduler(): {
    register: (task: ScheduledTask) => void;
    list: () => ScheduledTask[];
};
//# sourceMappingURL=scheduler.d.ts.map