import type { LoadedTask } from "./types.js";
export type ScheduleRunnerFn = (name: string, payload?: unknown) => void | Promise<void>;
/** Build a runner that invokes a schedule's run by name (e.g. "interval.example"). */
export declare function createScheduleRunner(tasks: LoadedTask[]): ScheduleRunnerFn;
export declare function getOrCreateScheduleRunner(appDir: string): Promise<ScheduleRunnerFn>;
export declare function clearScheduleRunnerCache(appDir?: string): void;
export type ScannedSchedule = {
    name: string;
    filePath: string;
};
export declare function scanScheduleFiles(appDir: string): ScannedSchedule[];
export declare function loadScheduleModule(filePath: string, cacheBust?: string): Promise<LoadedTask | null>;
export declare function loadSchedulesFromApp(appDir: string, cacheBust?: string): Promise<LoadedTask[]>;
//# sourceMappingURL=scheduleLoader.d.ts.map