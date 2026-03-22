export type ValidateAppOptions = {
    /**
     * When true (e.g. during build), validation steps are logged.
     * When false (e.g. during dev), validations run with no logs.
     */
    isBuild?: boolean;
    /**
     * When true (default), validate entire app tree.
     * When false, scan only appDir (that directory only, no nested checking).
     */
    isRecursive?: boolean;
};
/**
 * Run all app validations for the given app directory.
 * - Routes: duplicate handler per path+method (and more in future).
 * When isBuild is true, logs each validation step; otherwise runs silently.
 * Throws on first validation failure.
 */
export declare function validateApp(appDir: string, options?: ValidateAppOptions): Promise<boolean>;
//# sourceMappingURL=validateApp.d.ts.map