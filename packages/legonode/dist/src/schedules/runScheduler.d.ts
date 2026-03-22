import type { LoadedTask, TaskContext } from "./types.js";
export type RunSchedulerOptions = {
    ctx?: TaskContext;
    onRun?: (taskName: string, ctx: TaskContext) => void | Promise<void>;
    onComplete?: (taskName: string, ctx: TaskContext) => void | Promise<void>;
    onError?: (taskName: string, err: unknown) => void;
};
/**
 * Start the scheduler for the given tasks. Uses setInterval for interval-based schedules
 * and setTimeout for "at" schedules (day/week/month), then reschedules.
 * Does not return; call from a long-running process.
 */
export declare function runScheduler(tasks: LoadedTask[], options?: RunSchedulerOptions): () => void;
//# sourceMappingURL=runScheduler.d.ts.map