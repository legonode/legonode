import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { invalidateModuleCache } from "../loader/moduleCache.js";
import { createEventBus } from "./eventBus.js";
import type { EventBus, EventHandler } from "./eventBus.js";

const eventBusCache = new Map<string, EventBus>();

export async function getOrCreateEventBus(appDir: string): Promise<EventBus> {
  const key = resolve(appDir);
  let bus = eventBusCache.get(key);
  if (bus) return bus;
  bus = createEventBus();
  await registerEventHandlersFromApp(bus, appDir);
  eventBusCache.set(key, bus);
  return bus;
}

export function clearEventBusCache(appDir?: string): void {
  if (appDir) eventBusCache.delete(resolve(appDir));
  else eventBusCache.clear();
}

const EVENT_EXTENSIONS = [".event.ts", ".event.js", ".event.mts", ".event.mjs"];
const EVENTS_DIR = "events";

/** Convert filename (e.g. userCreated) to event name (e.g. user.created) */
function eventNameFromFile(baseName: string): string {
  if (!baseName.length) return "";
  const parts: string[] = [];
  let current = baseName[0]!.toLowerCase();
  for (let i = 1; i < baseName.length; i++) {
    const c = baseName[i]!;
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

export async function registerEventHandlersFromApp(bus: EventBus, appDir: string): Promise<void> {
  const eventsDir = resolve(appDir, EVENTS_DIR);
  let entries: { name: string; isFile?: boolean }[];
  try {
    entries = readdirSync(eventsDir, { withFileTypes: true }).map((e) => ({
      name: e.name,
      isFile: e.isFile()
    }));
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.isFile) continue;
    const ext = EVENT_EXTENSIONS.find((e) => entry.name.endsWith(e));
    if (!ext) continue;
    const baseName = entry.name.slice(0, -ext.length);
    const eventName = eventNameFromFile(baseName);
    if (!eventName) continue;

    const filePath = join(eventsDir, entry.name);
    try {
      const bust = process.env.LEGONODE_EVENT_RELOAD_TOKEN;
      if (bust) invalidateModuleCache(filePath);
      const url = pathToFileURL(filePath).href;
      const importUrl = bust ? `${url}?t=${bust}` : url;
      const mod = await import(importUrl);
      const handler = mod.default;
      if (typeof handler !== "function") continue;
      bus.on(eventName, handler as EventHandler);
    } catch {
      // skip invalid or failing modules
    }
  }
}
