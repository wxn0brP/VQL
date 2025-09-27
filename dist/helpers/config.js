export class VQLConfig {
    hidePath = false;
    strictSelect = false;
    strictACL = false;
    noCheckPermissions = true;
    constructor(config) {
        if (config) {
            Object.assign(this, config);
        }
    }
}
