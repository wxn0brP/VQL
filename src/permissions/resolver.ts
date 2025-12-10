import {
    PathMatcher,
    PermissionResolver,
    ResolverEntry,
    ValidEngineOpts
} from "../types/resolver";
import { PermValidFn, PermValidFnArgs, ValidFnResult } from "../types/perm";
import { GateWarden } from "@wxn0brp/gate-warden";

export class PermissionResolverEngine {
    private resolvers: ResolverEntry[] = [];

    addResolver(matcher: PathMatcher, resolver: PermissionResolver, opts: ValidEngineOpts | ValidEngineOpts["stringMode"] = {}): void {
        if (typeof opts === "string") opts = { stringMode: opts };
        this.resolvers.push({ matcher, resolver, opts });
    }

    create(): PermValidFn {
        return async (args: PermValidFnArgs): Promise<ValidFnResult> => {
            const originalPath: string = args.path.join("/");

            for (const { matcher, resolver, opts } of this.resolvers) {
                let isMatch = false;

                if (typeof matcher === "string") {
                    const { stringMode } = opts;
                    if (stringMode === "endsWith") isMatch = originalPath.endsWith(matcher);
                    else if (stringMode === "startsWith") isMatch = originalPath.startsWith(matcher);
                    else if (stringMode === "includes") isMatch = originalPath.includes(matcher);
                    else isMatch = originalPath === matcher;

                } else if (matcher instanceof RegExp) {
                    isMatch = matcher.test(originalPath);

                } else if (typeof matcher === "function") {
                    isMatch = await matcher(originalPath, args.path);
                }

                if (!isMatch) continue;

                try {
                    const resolverGranted = await resolver(args);
                    return { granted: resolverGranted, via: `resolver`, reason: "resolver" };
                } catch (error) {
                    console.error(`[Resolver Engine] Error in custom resolver for path ${originalPath}:`, error);
                    return { granted: false, via: `resolver`, reason: "resolver-error" };
                }
            }

            return { granted: false, via: `resolver`, reason: "no-resolver-match" };
        };
    }

    createWithGw(gw: GateWarden): PermValidFn {
        const resolver = this.create();

        return async (args: PermValidFnArgs): Promise<ValidFnResult> => {
            const resolverResult = await resolver(args);

            if (resolverResult.granted) return resolverResult;
            if (resolverResult.reason !== `no-resolver-match`) return resolverResult;

            const gwResult = await gw.hasAccess(args.user.id, args.field, args.p);
            return { granted: gwResult.granted, via: `gate-warden`, reason: gwResult.via };
        };
    }
}