import type {
  AddPluginToLegonodeConfigInput,
  AddPluginToLegonodeConfigResult,
} from "./addPluginToLegonodeConfig.js";

/** Passed to a package's `setup` export when using `legonode add -p <pkg>`. */
export type LegonodePluginSetupContext = {
  cwd: string;
  /** npm package name passed to `legonode add -p`. */
  packageName: string;
  /**
   * True when `legonode add --skip-install` was used (no `bun add` / `npm install` for the plugin).
   * Setup still runs; plugins may log extra hints if CLI tools are missing from `node_modules`.
   */
  skipInstall?: boolean;
  /**
   * Patches `legonode.config.ts`: merges imports and appends entries to `plugins`.
   * Only supports `legonode.config.ts` (not `.js`).
   */
  addPluginToLegonodeConfig: (
    input: Omit<AddPluginToLegonodeConfigInput, "configFile"> & { configFile?: string },
  ) => Promise<AddPluginToLegonodeConfigResult>;
  log: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
  };
};

export type LegonodePluginSetupFn = (
  ctx: LegonodePluginSetupContext,
) => void | Promise<void>;
