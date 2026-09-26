/**
 * Use {@link VQLConfig} to configure the behavior of VQL.
 */
export interface VQLConfigInterface {
    hidePath: boolean;
    strictSelect: boolean;
    strictACL: boolean;
    noCheckPermissions: boolean;
    permissionDeniedIfNoUser: boolean;
    allowEmptyAdd: boolean;
}
export declare class VQLConfig implements VQLConfigInterface {
    hidePath: boolean;
    strictSelect: boolean;
    strictACL: boolean;
    noCheckPermissions: boolean;
    permissionDeniedIfNoUser: boolean;
    allowEmptyAdd: boolean;
    constructor(config?: Partial<VQLConfigInterface>);
}
