export class PermissionResolverEngine {
    resolvers = [];
    addResolver(matcher, resolver, opts = {}) {
        if (typeof opts === "string")
            opts = { stringMode: opts };
        this.resolvers.push({ matcher, resolver, opts });
    }
    create() {
        return async (args) => {
            const originalPath = args.path.join("/");
            for (const { matcher, resolver, opts } of this.resolvers) {
                let isMatch = false;
                if (typeof matcher === "string") {
                    const { stringMode } = opts;
                    if (stringMode === "endsWith")
                        isMatch = originalPath.endsWith(matcher);
                    else if (stringMode === "startsWith")
                        isMatch = originalPath.startsWith(matcher);
                    else if (stringMode === "includes")
                        isMatch = originalPath.includes(matcher);
                    else
                        isMatch = originalPath === matcher;
                }
                else if (matcher instanceof RegExp) {
                    isMatch = matcher.test(originalPath);
                }
                else if (typeof matcher === "function") {
                    isMatch = await matcher(originalPath, args.path);
                }
                if (!isMatch)
                    continue;
                try {
                    const resolverGranted = await resolver(args);
                    return { granted: resolverGranted, via: `resolver`, reason: "resolver" };
                }
                catch (error) {
                    console.error(`[Resolver Engine] Error in custom resolver for path ${originalPath}:`, error);
                    return { granted: false, via: `resolver`, reason: "resolver-error" };
                }
            }
            return { granted: false, via: `resolver`, reason: "no-resolver-match" };
        };
    }
    createWithGw(gw) {
        const resolver = this.create();
        return async (args) => {
            const resolverResult = await resolver(args);
            if (resolverResult.granted)
                return resolverResult;
            if (resolverResult.reason !== `no-resolver-match`)
                return resolverResult;
            const gwResult = await gw.hasAccess(args.user.id, args.field, args.p);
            return { granted: gwResult.granted, via: `gate-warden`, reason: gwResult.via };
        };
    }
}
