export class PermissionResolverEngine {
    resolvers = [];
    addResolver(matcher, resolver) {
        this.resolvers.push({ matcher, resolver });
    }
    create() {
        return async (args) => {
            const originalPath = args.path.join("/");
            for (const { matcher, resolver } of this.resolvers) {
                let isMatch = false;
                if (typeof matcher === "string") {
                    isMatch = originalPath === matcher;
                }
                else if (matcher instanceof RegExp) {
                    isMatch = matcher.test(originalPath);
                }
                else if (typeof matcher === "function") {
                    isMatch = await matcher(originalPath, args.path);
                }
                if (isMatch) {
                    try {
                        const resolverGranted = await resolver(args);
                        return { granted: resolverGranted, via: `resolver` };
                    }
                    catch (error) {
                        console.error(`[Resolver Engine] Error in custom resolver for path ${originalPath}:`, error);
                        return { granted: false, via: `resolver-error` };
                    }
                }
            }
            return { granted: false, via: `no-resolver-match` };
        };
    }
    createWithGw(gw) {
        const resolver = this.create();
        return async (args) => {
            const resolverResult = await resolver(args);
            if (resolverResult.granted)
                return resolverResult;
            if (!resolverResult.granted && resolverResult.via !== `no-resolver-match`)
                return resolverResult;
            const gwResult = await gw.hasAccess(args.user.id, args.field, args.p);
            return { granted: gwResult.granted, via: `gate-warden` };
        };
    }
}
