# @legonode/cron

Cron schedules and plugin for `legonode`.

This package provides:
- A `createCronPlugin()` plugin that runs tasks from `app/cron/*.cron.ts`
- Manual task triggering via `ctx.schedule(name, payload, options?)`
- Schedule loader/runner utilities if you want low-level control

## Install

In this monorepo it is a workspace package.

For external usage:

```bash
bun add @legonode/cron
```

`legonode` is a peer dependency.

## Basic Usage

Add the plugin in `legonode.config.ts`:

```ts
import type { LegonodeConfig } from "legonode";
import { createCronPlugin } from "@legonode/cron";

const config: LegonodeConfig = {
  plugins: [createCronPlugin()]
};

export default config;
```

## Disable Cron In Dev

If you want cron files to not run during `legonode dev`:

```ts
plugins: [createCronPlugin({ disableDevCron: true })]
```

This only disables scheduled/background runs in dev mode. The plugin still keeps cron lookup available for manual `ctx.schedule(...)`.

## Cron File Format

Create files in `app/cron` with names ending in `.cron.ts` (or `.js`, `.mts`, `.mjs`).

Example:

```ts
import type { ScheduleDef, TaskContext } from "@legonode/cron";

export const schedule: ScheduleDef = { every: "10s" };

export async function run(ctx: TaskContext) {
  console.log("cron run", ctx.payload);
}
```

Supported schedule styles:
- `{ every: "minute" }`
- `{ every: "hour" }`
- `{ every: "day", at: "09:30" }`
- `{ every: "week", day: "monday", at: "10:00" }`
- `{ every: "month", date: 1, at: "00:00" }`
- `{ every: "10s" }`, `{ every: "5m" }`, `{ every: "2h" }`, etc.

## Manual Trigger From Request Context

The plugin augments `LegonodeContext` with:

```ts
ctx.schedule(name, payload?, { delayMs?, at? })
```

Example:

```ts
await ctx.schedule("interval.example", { source: "api" }, { delayMs: 2000 });
```

`at` accepts:
- `Date`
- epoch milliseconds (`number`)
- Date-parsable string

## Exports

Top-level exports include:
- `createCronPlugin`
- `ScheduleDef`, `Schedule`, `TaskContext`, `TaskRunFn`, `LoadedTask`
- `loadSchedulesFromApp`, `scanScheduleFiles`, `createScheduleRunner`, `runScheduler`, and related helpers

