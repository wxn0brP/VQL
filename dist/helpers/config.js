export class VQLConfig {
    hidePath = false;
    strictSelect = false;
    strictACL = false;
    noCheckPermissions = true;
    permissionDeniedIfNoUser = true;
    constructor(config) {
        if (config) {
            Object.assign(this, config);
        }
        if (!this.noCheckPermissions && !this.strictSelect) {
            throw new Error("strictSelect must be true when permissions are enabled (noCheckPermissions: false). " +
                "Without strictSelect, nested fields without READ permission can be leaked.");
        }
    }
}
