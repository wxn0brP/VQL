export enum PermCRUD {
    CREATE = 1 << 0,
    READ = 1 << 1,
    UPDATE = 1 << 2,
    DELETE = 1 << 3,
}

export interface VQLPermissionCheck {
    type: "GateWarden" | "Internal" | "Custom";
    flag?: number;
    checkFn?: (user: any, data: any) => boolean | Promise<boolean>;
}