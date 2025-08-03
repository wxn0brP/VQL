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
export type ValidFn = (path: string, perm: number, user: any) => Promise<ValidFnResult>;
