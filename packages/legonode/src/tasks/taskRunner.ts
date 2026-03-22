import type { ScheduledTask } from "./scheduler.js";

export async function runTask(task: ScheduledTask) {
  await task.run();
}

