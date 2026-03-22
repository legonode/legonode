import { readdirSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { pathToFileURL } from "node:url";
import { invalidateModuleCache } from "../loader/moduleCache.js";
import type { Schedule, ScheduleDef, LoadedTask, TaskRunFn, TaskContext } from "./types.js";

const CRON_EXTENSIONS = [".cron.ts", ".cron.js", ".cron.mts", ".cron.mjs"];
const CRON_DIR = "cron";

/** Convert task name (e.g. intervalExample) to schedule name (e.g. interval.example). */
function toScheduleName(name: string): string {
  if (!name.length) return "";
  const parts: string[] = [];
  let current = name[0]!.toLowerCase();
  for (let i = 1; i < name.length; i++) {
    const c = name[i]!;
    if (c >= "A" && c <= "Z") {
      parts.push(current);
      current = c.toLowerCase();
    } else {
      current += c;
    }
  }
  parts.push(current);
  return parts.join(".");
}

export type ScheduleRunnerFn = (name: string, payload?: unknown) => void | Promise<void>;

const scheduleRunnerCache = new Map<string, ScheduleRunnerFn>();

/** Build a runner that invokes a schedule's run by name (e.g. "interval.example"). */
export function createScheduleRunner(tasks: LoadedTask[]): ScheduleRunnerFn {
  const byName = new Map<string, LoadedTask>();
  for (const task of tasks) {
    byName.set(toScheduleName(task.name), task);
  }
  return (name: string, payload?: unknown) => {
    const task = byName.get(name);
    if (!task) {
      console.warn(`[legonode] schedule not found: "${name}"`);
      return;
    }
    const ctx: TaskContext = { payload };
    return Promise.resolve(task.run(ctx));
  };
}

export async function getOrCreateScheduleRunner(appDir: string): Promise<ScheduleRunnerFn> {
  const key = resolve(appDir);
  let runner = scheduleRunnerCache.get(key);
  if (runner) return runner;
  const cacheBust = typeof process !== "undefined" ? process.env.LEGONODE_CRON_RELOAD_TOKEN : undefined;
  const tasks = await loadSchedulesFromApp(appDir, cacheBust);
  runner = createScheduleRunner(tasks);
  scheduleRunnerCache.set(key, runner);
  return runner;
}

export function clearScheduleRunnerCache(appDir?: string): void {
  if (appDir) scheduleRunnerCache.delete(resolve(appDir));
  else scheduleRunnerCache.clear();
}

function normalizeSchedule(schedule: Schedule): ScheduleDef[] {
  if (Array.isArray(schedule)) return schedule;
  return [schedule];
}

export type ScannedSchedule = { name: string; filePath: string };

export function scanScheduleFiles(appDir: string): ScannedSchedule[] {
  const base = resolve(appDir, CRON_DIR);
  const list: ScannedSchedule[] = [];
  let entries: { name: string; isFile?: boolean }[];
  try {
    entries = readdirSync(base, { withFileTypes: true }).map((e) => ({
      name: e.name,
      isFile: e.isFile()
    }));
  } catch {
    return list;
  }
  for (const entry of entries) {
    if (!entry.isFile) continue;
    const ext = CRON_EXTENSIONS.find((e) => entry.name.endsWith(e));
    if (!ext) continue;
    const name = entry.name.slice(0, -ext.length);
    list.push({ name, filePath: join(base, entry.name) });
  }
  return list;
}

export async function loadScheduleModule(
  filePath: string,
  cacheBust?: string
): Promise<LoadedTask | null> {
  try {
    if (cacheBust) invalidateModuleCache(filePath);
    const url = pathToFileURL(filePath).href;
    const importUrl = cacheBust ? `${url}?t=${cacheBust}` : url;
    const mod = await import(importUrl);
    const schedule = mod.schedule;
    const run = mod.run;
    if (schedule == null || typeof run !== "function") return null;
    const scheduleList = normalizeSchedule(schedule as Schedule);
    const name = (mod.name ?? basename(filePath).replace(/\.cron\.(ts|js|mts|mjs)$/i, "")) || "task";
    return {
      name,
      schedule: scheduleList,
      run: run as TaskRunFn
    };
  } catch {
    return null;
  }
}

export async function loadSchedulesFromApp(
  appDir: string,
  cacheBust?: string
): Promise<LoadedTask[]> {
  const scanned = scanScheduleFiles(appDir);
  const tasks: LoadedTask[] = [];
  for (const { filePath } of scanned) {
    const task = await loadScheduleModule(filePath, cacheBust);
    if (task) tasks.push(task);
  }
  return tasks;
}
