import { PermValidFnArgs } from "./perm";

export interface GWUser {
    _id: string;
}

export type PathMatcher = string | RegExp | ((path: string, pathSegments: string[]) => Promise<boolean>);
export type PermissionResolver = (args: PermValidFnArgs) => Promise<boolean>;

export interface ResolverEntry {
    matcher: PathMatcher;
    resolver: PermissionResolver;
    opts: ValidEngineOpts;
}

export interface ResolverValidFnResult {
    granted: boolean;
    via: string;
}

export interface ValidEngineOpts {
    stringMode?: "equal" | "startsWith" | "endsWith";
}