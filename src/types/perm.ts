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

export type PermValidFn = (path: string, perm: number, user: any) => Promise<ValidFnResult>;