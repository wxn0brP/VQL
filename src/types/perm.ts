import { AccessResult } from "@wxn0brp/gate-warden";

export enum PermCRUD {
    CREATE = 1 << 0,
    READ = 1 << 1,
    UPDATE = 1 << 2,
    DELETE = 1 << 3,
    COLLECTION = 1 << 4
}

export interface ValidFnResult {
    granted: boolean;
    via?: "resolver" | "gate-warden";
    reason?: AccessResult["via"] | "resolver" | "no-resolver-match" | "resolver-error";
}

export interface PermValidFnArgs {
    /** sha256/json */
    field: string;
    /** original path */
    path: string[];
    /** permission */
    p: number;
    user: any;
}

export type PermValidFn = (args: PermValidFnArgs) => Promise<ValidFnResult>;