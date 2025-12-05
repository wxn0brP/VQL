export declare enum PermCRUD {
    CREATE = 1,
    READ = 2,
    UPDATE = 4,
    DELETE = 8,
    COLLECTION = 16
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
