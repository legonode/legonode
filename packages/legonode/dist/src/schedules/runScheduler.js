import { getIntervalMs, isAtSchedule, getNextRunMs } from "./parseSchedule.js";
/**
 * Start the scheduler for the given tasks. Uses setInterval for interval-based schedules
 * and setTimeout for "at" schedules (day/week/month), then reschedules.
 * Does not return; call from a long-running process.
 */
export function runScheduler(tasks, options = {}) {
    const ctx = options.ctx ?? {};
    const onRun = options.onRun ?? null;
    const onComplete = options.onComplete ?? null;
    const onError = options.onError ?? ((name, err) => console.error(`[legonode task ${name}]`, err));
    const timeouts = [];
    const intervals = [];
    function runTask(task) {
        void (async () => {
            try {
                if (onRun)
                    await onRun(task.name, ctx);
                await task.run(ctx);
                if (onComplete)
                    await onComplete(task.name, ctx);
            }
            catch (err) {
                onError(task.name, err);
            }
        })();
    }
    function scheduleAt(task, def) {
        // Use at least 1s delay so we don't reschedule in the same second and risk multiple runs (e.g. hot reload).
        const ms = Math.max(1000, getNextRunMs(def));
        const t = setTimeout(() => {
            runTask(task);
            scheduleAt(task, def);
        }, ms);
        timeouts.push(t);
    }
    for (const task of tasks) {
        for (const def of task.schedule) {
            const intervalMs = getIntervalMs(def);
            if (intervalMs !== null) {
                // First run after intervalMs, then every intervalMs (no run at startup)
                const t = setInterval(() => runTask(task), intervalMs);
                intervals.push(t);
                continue;
            }
            if (isAtSchedule(def)) {
                scheduleAt(task, def);
            }
        }
    }
    return function stop() {
        for (const t of timeouts)
            clearTimeout(t);
        for (const t of intervals)
            clearInterval(t);
    };
}
//# sourceMappingURL=runScheduler.js.map