import { GateWarden } from "@wxn0brp/gate-warden";
import { PermValidFn } from "./types/perm";

export function createGwValidFn(gw: GateWarden): PermValidFn {
    return async (args) => {
        return gw.hasAccess(args.user.id, args.field, args.p);
    }
}