export interface VQLConfigInterface {
    hidePath: boolean;
    strictSelect: boolean;
    strictACL: boolean;
    noCheckPermissions: boolean;
}

export class VQLConfig implements VQLConfigInterface {
    hidePath = false;
    strictSelect = false;
    strictACL = false;
    noCheckPermissions = true;

    constructor(config?: Partial<VQLConfigInterface>) {
        if (config) {
            Object.assign(this, config);
        }
    }
}
