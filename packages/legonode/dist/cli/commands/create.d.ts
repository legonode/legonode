export type CreateOptions = {
    /** Project name or "." for current directory; undefined = prompt user */
    name?: string;
    /** Skip package manager install */
    noInstall?: boolean;
};
export declare const createCommand: {
    readonly name: "create";
    readonly run: (opts?: CreateOptions) => Promise<void>;
};
//# sourceMappingURL=create.d.ts.map