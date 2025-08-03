import { GateWarden } from "@wxn0brp/gate-warden";
import { ValidFn } from "./types/perm";

export function createGwValidFn(gw: GateWarden): ValidFn {
    return async (path: string, perm: number, user: any) => {
        return gw.hasAccess(user.id, path, perm);
    }
}