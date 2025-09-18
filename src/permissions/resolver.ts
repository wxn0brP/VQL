import {
    GWUser,
    PathMatcher,
    PermissionResolver,
    ResolverEntry
} from "../types/resolver";
import { PermValidFn, PermValidFnArgs } from "../types/perm";

export class PermissionResolverEngine {
    private resolvers: ResolverEntry[] = [];

    addResolver(matcher: PathMatcher, resolver: PermissionResolver): void {
        this.resolvers.push({ matcher, resolver });
    }

    createResolverOnlyPermValidFn(): PermValidFn {
        return async (args: PermValidFnArgs): Promise<{ granted: boolean; via?: string }> => {
            const originalPath: string = args.path.join("/");

            for (const { matcher, resolver } of this.resolvers) {
                let isMatch = false;

                if (typeof matcher === "string") {
                    isMatch = originalPath === matcher;
                } else if (matcher instanceof RegExp) {
                    isMatch = matcher.test(originalPath);
                } else if (typeof matcher === "function") {
                    isMatch = await matcher(originalPath, args.path);
                }

                if (isMatch) {
                    try {
                        const resolverGranted = await resolver(args);
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