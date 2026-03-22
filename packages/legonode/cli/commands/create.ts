import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { execSync, spawn } from "node:child_process";
import { input, select } from "@inquirer/prompts";
import { appLogger } from "../../src/utils/logger.js";

export type CreateOptions = {
  /** Project name or "." for current directory; undefined = prompt user */
  name?: string;
  /** Skip package manager install */
  noInstall?: boolean;
};

type PackageManager = "npm" | "yarn" | "pnpm" | "bun";

function isPackageManagerAvailable(cmd: PackageManager): boolean {
  try {
    execSync(`${cmd} --version`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function getAvailablePackageManagers(): PackageManager[] {
  const all: PackageManager[] = ["npm", "yarn", "pnpm", "bun"];
  return all.filter(isPackageManagerAvailable);
}

const PACKAGE_JSON = (name: string) => `{
  "name": "${name}",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "legonode dev",
    "build": "legonode build",
    "start": "legonode start"
  },
  "dependencies": {
    "legonode": "^0.0.2"
  },
  "devDependencies": {
    "typescript": "^5.9.0"
  }
}
`;

const TSCONFIG_JSON = `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*", "legonode.config.ts"]
}
`;

const LEGONODE_CONFIG_TS = `import type { LegonodeConfig } from "legonode";

const config: LegonodeConfig = {
  dev: {
    logPretty: true,
  },
};

export default config;
`;

const PING_ROUTE_TS = `import type { Context } from "legonode";

export async function GET(ctx: Context) {
  ctx.res.status(200);
  return { message: "pong" };
}
`;

function sanitizePackageName(name: string): string {
  return name.replace(/[^a-z0-9-]/gi, "-").toLowerCase() || "my-legonode-app";
}

export const createCommand = {
  name: "create",
  run: async (opts: CreateOptions = {}) => {
    const cwd = process.cwd();

    // Resolve project name: prompt if not provided
    let projectName: string;
    if (opts.name === undefined) {
      const answered = await input({
        message: "Project name (leave empty to use current directory):",
        default: "",
      });
      projectName = answered.trim() === "" ? "." : answered.trim();
    } else {
      projectName = opts.name;
    }

    const targetDir = projectName === "." ? cwd : resolve(cwd, projectName);

    if (projectName !== "." && existsSync(targetDir)) {
      const entries = readdirSync(targetDir);
      if (entries.length > 0) {
        appLogger.error(`Directory "${projectName}" already exists and is not empty.`);
        process.exit(1);
      }
    }

    // Package.json name: use folder name when in current dir, else use project name
    const packageJsonName =
      projectName === "."
        ? sanitizePackageName(basename(cwd)) || "my-legonode-app"
        : sanitizePackageName(projectName);

    appLogger.info("legonode create");
    appLogger.info(`  Creating project in ${targetDir}`);

    function ensureDir(path: string) {
      if (!existsSync(path)) {
        mkdirSync(path, { recursive: true });
      }
    }

    function write(path: string, content: string) {
      ensureDir(resolve(path, ".."));
      writeFileSync(path, content.trimStart(), "utf-8");
    }

    // package.json
    write(join(targetDir, "package.json"), PACKAGE_JSON(packageJsonName));

    // tsconfig.json
    write(join(targetDir, "tsconfig.json"), TSCONFIG_JSON);

    // legonode.config.ts
    write(join(targetDir, "legonode.config.ts"), LEGONODE_CONFIG_TS);

    // src/router/ping/route.ts
    const srcPath = join(targetDir, "src");
    write(join(srcPath, "router", "ping", "route.ts"), PING_ROUTE_TS);

    appLogger.info(`  Created: package.json, tsconfig.json, legonode.config.ts`);
    appLogger.info(`  Created: src/router/ping/route.ts`);

    // Package manager selection and install
    let depsInstalled = false;
    if (!opts.noInstall) {
      const available = getAvailablePackageManagers();
      if (available.length === 0) {
        appLogger.warn("  No package manager found (npm, yarn, pnpm, bun). Run install manually.");
      } else {
        const choices = [
          ...available.map((pm) => ({ name: pm, value: pm, description: `Use ${pm} to install dependencies` })),
          { name: "Skip install", value: "skip" as const, description: "Don't install dependencies now" },
        ];
        const selected = await select({
          message: "Select a package manager (use ↑/↓ arrows):",
          choices,
        });

        if (selected !== "skip") {
          appLogger.info(`  Installing dependencies with ${selected}...`);
          await new Promise<void>((resolvePromise, reject) => {
            const args = selected === "bun" ? ["install"] : ["install"];
            const child = spawn(selected, args, {
              stdio: "inherit",
              cwd: targetDir,
            });
            child.on("exit", (code) => {
              if (code === 0) {
                appLogger.info("  Done!");
                depsInstalled = true;
                resolvePromise();
              } else {
                reject(new Error(`${selected} install exited with code ${code}`));
              }
            });
            child.on("error", reject);
          });
        } else {
          appLogger.info("  Skipped install. Run your package manager to install dependencies.");
        }
      }
    } else {
      appLogger.info("  Run your package manager to install dependencies.");
    }

    appLogger.info("");
    appLogger.info("Next steps:");
    appLogger.info(`  cd ${projectName === "." ? "." : projectName}`);
    if (!depsInstalled) {
      appLogger.info("  npm install   # or: yarn / pnpm / bun install");
    }
    appLogger.info("  legonode dev");
  },
} as const;
