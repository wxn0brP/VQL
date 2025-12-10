import { GateWarden } from "@wxn0brp/gate-warden";
import { PermValidFn } from "../types/perm";

export function createGwValidFn(gw: GateWarden): PermValidFn {
    return async (args) => {
        const res = await gw.hasAccess(args.user.id, args.field, args.p);
        return { granted: res.granted, via: `gate-warden`, reason: res.via };
    }
}