export interface VQLConfigInterface {
    hidePath: boolean;
    strictSelect: boolean;
    strictACL: boolean;
    noCheckPermissions: boolean;
    formatAjv: boolean;
}

export class VQLConfig implements VQLConfigInterface {
    hidePath = true;
    strictSelect = true;
    strictACL = true;
    noCheckPermissions = false;
    formatAjv = true;

    constructor(config?: Partial<VQLConfigInterface>) {
        if (config) {
            Object.assign(this, config);
        }
    }
}
