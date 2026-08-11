export interface VQLConfigInterface {
    hidePath: boolean;
    strictSelect: boolean;
    strictACL: boolean;
    noCheckPermissions: boolean;
    permissionDeniedIfNoUser: boolean;
}
export declare class VQLConfig implements VQLConfigInterface {
    hidePath: boolean;
    strictSelect: boolean;
    strictACL: boolean;
    noCheckPermissions: boolean;
    permissionDeniedIfNoUser: boolean;
    constructor(config?: Partial<VQLConfigInterface>);
}
