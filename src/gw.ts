import { GateWarden } from "@wxn0brp/gate-warden";
import { PermValidFn } from "./types/perm";

export function createGwValidFn(gw: GateWarden): PermValidFn {
    return async (path: string, perm: number, user: any) => {
        return gw.hasAccess(user.id, path, perm);
    }
}