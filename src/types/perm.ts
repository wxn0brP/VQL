export enum PermCRUD {
    CREATE = 1 << 0,
    READ = 1 << 1,
    UPDATE = 1 << 2,
    DELETE = 1 << 3,
    COLLECTION = 1 << 4
}

export interface ValidFnResult {
    granted: boolean;
    via?: string;
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