export type DevOptions = {
    port?: string;
    host?: string;
    appDir?: string;
    hotReloadStop?: boolean;
};
declare function run(opts?: DevOptions): Promise<void>;
export declare const devCommand: {
    readonly name: "dev";
    readonly run: typeof run;
};
export {};
//# sourceMappingURL=dev.d.ts.map