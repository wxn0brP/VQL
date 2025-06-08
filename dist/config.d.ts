export interface VQLConfigInterface {
    hidePath: boolean;
    strictSelect: boolean;
    strictACL: boolean;
    noCheckPermissions: boolean;
    formatAjv: boolean;
}
export declare class VQLConfig implements VQLConfigInterface {
    hidePath: boolean;
    strictSelect: boolean;
    strictACL: boolean;
    noCheckPermissions: boolean;
    formatAjv: boolean;
    constructor(config?: Partial<VQLConfigInterface>);
}
