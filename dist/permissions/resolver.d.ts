import { GateWarden } from "@wxn0brp/gate-warden";
import { PermValidFn } from "../types/perm.js";
import { PathMatcher, PermissionResolver, ValidEngineOpts } from "../types/resolver.js";
export declare class PermissionResolverEngine {
    private resolvers;
    addResolver(matcher: PathMatcher, resolver: PermissionResolver, opts?: ValidEngineOpts | ValidEngineOpts["stringMode"]): void;
    create(): PermValidFn;
    createWithGw(gw: GateWarden): PermValidFn;
}
