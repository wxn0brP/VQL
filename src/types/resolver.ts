export interface GWUser {
    _id: string;
}

export interface PermValidFn {
    (path: string, perm: number, user: GWUser): Promise<{ granted: boolean; via?: string }>;
}

export type PathMatcher = string | RegExp | ((path: string) => boolean);
export type PermissionResolver = (path: string, perm: number, user: GWUser) => Promise<boolean>;

export interface ResolverEntry {
    matcher: PathMatcher;
    resolver: PermissionResolver;
}

export interface ResolverValidFnResult {
    granted: boolean;
    via: string;
}