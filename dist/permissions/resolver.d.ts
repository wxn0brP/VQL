import { PathMatcher, PermissionResolver, ValidEngineOpts } from "../types/resolver.js";
import { PermValidFn } from "../types/perm.js";
import { GateWarden } from "@wxn0brp/gate-warden";
export declare class PermissionResolverEngine {
    private resolvers;
    addResolver(matcher: PathMatcher, resolver: PermissionResolver, opts?: ValidEngineOpts | ValidEngineOpts["stringMode"]): void;
    create(): PermValidFn;
    createWithGw(gw: GateWarden): PermValidFn;
}
