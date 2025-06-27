export class VQLConfig {
    hidePath = true;
    strictSelect = true;
    strictACL = true;
    noCheckPermissions = false;
    formatAjv = true;
    constructor(config) {
        if (config) {
            Object.assign(this, config);
        }
    }
}
