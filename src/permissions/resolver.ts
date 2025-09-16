import {
    GWUser,
    PathMatcher,
    PermissionResolver,
    PermValidFn,
    ResolverEntry
} from "../types/resolver";

export class PermissionResolverEngine {
    private resolvers: ResolverEntry[] = [];

    addResolver(matcher: PathMatcher, resolver: PermissionResolver): void {
        this.resolvers.push({ matcher, resolver });
    }

    clearResolvers(): void {
        this.resolvers = [];
    }

    createEnhancedPermValidFn(gwPermValidFn: PermValidFn): PermValidFn {
        return async (path: string, perm: number, user: GWUser): Promise<{ granted: boolean; via?: string }> => {
            const originalPath: string = path;

            for (const { matcher, resolver } of this.resolvers) {
                let isMatch = false;

                if (typeof matcher === "string") {
                    isMatch = originalPath === matcher;
                } else if (matcher instanceof RegExp) {
                    isMatch = matcher.test(originalPath);
                } else if (typeof matcher === "function") {
                    isMatch = matcher(originalPath);
                }

                if (isMatch) {
                    try {
                        const resolverGranted = await resolver(originalPath, perm, user);

                        if (resolverGranted === true) {
                            return { granted: true, via: `resolver` };
                        } else {
                            return { granted: false, via: `resolver` };
                        }
                    } catch (error) {
                        console.error(`[Resolver Engine] Error in custom resolver for path ${originalPath}:`, error);
                        return { granted: false, via: `resolver-error` };
                    }
                }
            }

            try {
                const gwResult = await gwPermValidFn(path, perm, user);
                return gwResult;
            } catch (error) {
                console.error(`[Resolver Engine] Error calling Gate Warden for path ${originalPath}:`, error);
                return { granted: false, via: `gw-error` };
            }
        };
    }

    createResolverOnlyPermValidFn(): PermValidFn {
        return async (path: string, perm: number, user: GWUser): Promise<{ granted: boolean; via?: string }> => {
            const originalPath: string = path;

            for (const { matcher, resolver } of this.resolvers) {
                let isMatch = false;

                if (typeof matcher === "string") {
                    isMatch = originalPath === matcher;
                } else if (matcher instanceof RegExp) {
                    isMatch = matcher.test(originalPath);
                } else if (typeof matcher === "function") {
                    isMatch = matcher(originalPath);
                }

                if (isMatch) {
                    try {
                        const resolverGranted = await resolver(originalPath, perm, user);
                        if (resolverGranted === true) {
                            return { granted: true, via: `resolver` };
                        } else {
                            return { granted: false, via: `resolver` };
                        }
                    } catch (error) {
                        console.error(`[Resolver Engine] Error in custom resolver for path ${originalPath}:`, error);
                        return { granted: false, via: `resolver-error` };
                    }
                }
            }

            return { granted: false, via: `no-resolver-match` };
        };
    }
}