/**
 * Use {@link VQLConfig} to configure the behavior of VQL.
 */
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
		if (!this.noCheckPermissions && !this.strictSelect) {
			throw new Error(
				"strictSelect must be true when permissions are enabled (noCheckPermissions: false). " +
					"Without strictSelect, nested fields without READ permission can be leaked.",
			);
		}
	}
}
