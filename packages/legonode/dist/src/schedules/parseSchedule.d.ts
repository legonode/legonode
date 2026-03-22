import type { ScheduleDef } from "./types.js";
/**
 * Returns interval in ms for setInterval, or null if this is an "at" schedule (day/week/month).
 */
export declare function getIntervalMs(def: ScheduleDef): number | null;
/**
 * Returns true if this schedule runs at a specific time (day at, week day at, month date at).
 */
export declare function isAtSchedule(def: ScheduleDef): boolean;
/**
 * Get ms until the next run for "at" schedules (day at HH:MM, week day at HH:MM, month date at HH:MM).
 * Never returns 0 so we avoid setTimeout(..., 0) and immediate re-runs.
 */
export declare function getNextRunMs(def: ScheduleDef): number;
//# sourceMappingURL=parseSchedule.d.ts.map