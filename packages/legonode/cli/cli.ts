#!/usr/bin/env node

/** Load tsx so Node can load .ts route files; no-op on Bun (uses native .ts). */
if (typeof (globalThis as any).Bun === "undefined") {
  try {
    // @ts-expect-error - tsx/esm has no type declarations
    await import("tsx/esm");
  } catch {
    // tsx not available; user may need: node --import tsx/esm ... or Bun
  }
}

import { program } from "commander";
import { createRequire } from "node:module";
import { devCommand } from "./commands/dev.js";
import { buildCommand } from "./commands/build.js";
import { startCommand } from "./commands/start.js";
import { createCommand } from "./commands/create.js";

const require = createRequire(import.meta.url);
const pkg = require("../../package.json") as { version?: string };

program
  .name("legonode")
  .description("Legonode framework CLI")
  .version(pkg.version ?? "0.0.1");

program
  .command("dev")
  .description("Run the app with hot reload")
  .option("-p, --port <number>", "Port to listen on (default: 3000)")
  .option("-H, --host <string>", "Hostname to bind (default: 127.0.0.1)")
  .option("--appDir <path>", "App directory (default: ./app)")
  .option("--hot-reload-stop", "Restart server on app file changes instead of in-process reload")
  .action((opts) => devCommand.run(opts));

program
  .command("build")
  .description("Build the app for production")
  .option("--build-path <path>", "Output directory (overrides config)")
  .action((opts) => buildCommand.run(opts));

program
  .command("create [name]")
  .description("Create a new Legonode project")
  .option("--no-install", "Skip npm/bun install")
  .action(async (name: string | undefined, cmd?: { opts: () => { install?: boolean } }) => {
    const opts = cmd?.opts?.() ?? {};
    const runOpts: { name?: string; noInstall: boolean } = {
      noInstall: opts.install === false,
    };
    if (name !== undefined) runOpts.name = name;
    await createCommand.run(runOpts);
  });

program
  .command("start")
  .description("Run the built app (no hot reload)")
  .option("-p, --port <number>", "Port (default: 3000)")
  .option("-H, --host <string>", "Hostname (default: 127.0.0.1)")
  .option("--build-path <path>", "Built app directory (overrides config)")
  .action((opts) => startCommand.run(opts));

program.parse(process.argv);
