export interface VQLConfigInterface {
    hidePath: boolean;
    strictSelect: boolean;
    strictACL: boolean;
    noCheckPermissions: boolean;
    permissionDeniedIfNoUser: boolean;
}

export class VQLConfig implements VQLConfigInterface {
    hidePath = false;
    strictSelect = false;
    strictACL = false;
    noCheckPermissions = true;
    permissionDeniedIfNoUser = true;

    constructor(config?: Partial<VQLConfigInterface>) {
        if (config) {
            Object.assign(this, config);
        }
    }
}
