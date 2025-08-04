export interface VQLConfigInterface {
    hidePath: boolean;
    strictSelect: boolean;
    strictACL: boolean;
    noCheckPermissions: boolean;
}
export declare class VQLConfig implements VQLConfigInterface {
    hidePath: boolean;
    strictSelect: boolean;
    strictACL: boolean;
    noCheckPermissions: boolean;
    constructor(config?: Partial<VQLConfigInterface>);
}
