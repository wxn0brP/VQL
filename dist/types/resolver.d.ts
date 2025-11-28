import { PermValidFnArgs } from "./perm.js";
export interface GWUser {
    _id: string;
}
export type PathMatcher = string | RegExp | ((path: string, pathSegments: string[]) => Promise<boolean>);
export type PermissionResolver = (args: PermValidFnArgs) => Promise<boolean>;
export interface ResolverEntry {
    matcher: PathMatcher;
    resolver: PermissionResolver;
}
export interface ResolverValidFnResult {
    granted: boolean;
    via: string;
}
