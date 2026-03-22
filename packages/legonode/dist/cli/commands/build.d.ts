export type BuildOptions = {
    buildPath?: string;
};
export declare const buildCommand: {
    readonly name: "build";
    readonly run: (opts?: BuildOptions) => Promise<void>;
};
//# sourceMappingURL=build.d.ts.map