import { VQLConfig } from "../helpers/config";
import { PermCRUD, PermValidFn } from "../types/perm";
import {
	VQL_OP_Find,
	VQL_OP_FindOne,
	VQL_OP_Update,
	VQL_OP_UpdateOneOrAdd,
	VQL_Query_CRUD,
	VQL_Query_CRUD_Keys,
} from "../types/vql";
import { extractPathsFromData, hashKey } from "./utils";
import { updateFindObject } from "@wxn0brp/db-core/utils/updateFindObject";

export async function extractPaths(
	config: VQLConfig,
	query: VQL_Query_CRUD,
): Promise<{
	db: string;
	c: string;
	paths: {
		filed?: string;
		p?: PermCRUD;
		c?: PermCRUD;
		path?: string[];
	}[];
}> {
	const operation = Object.keys(query.d)[0] as VQL_Query_CRUD_Keys;
	const collection = query.d[operation].collection;
	const permPaths = {
		db: await hashKey(config, query.db),
		c: collection,
		paths: [],
	};

	switch (operation) {
		case "f":
		case "find":
		case "findOne": {
			const qf = query.d[operation] as VQL_OP_Find | VQL_OP_FindOne;
			permPaths.paths.push({
				c: PermCRUD.READ,
			});
			permPaths.paths.push({
				filed: extractPathsFromData(qf.search),
				p: PermCRUD.READ,
			});
			break;
		}

		case "add":
			permPaths.paths.push({
				c: PermCRUD.CREATE,
			});
			break;

		case "update":
		case "updateOne": {
			const qu = query.d[operation] as VQL_OP_Update;
			permPaths.paths.push({
				filed: extractPathsFromData(qu.search),
				p: PermCRUD.READ,
			});
			permPaths.paths.push({
				filed: extractPathsFromData(qu.updater),
				p: PermCRUD.UPDATE,
			});
			break;
		}

		case "remove":
		case "removeOne":
			permPaths.paths.push({
				c: PermCRUD.DELETE,
			});
			break;

		case "updateOneOrAdd": {
			const qo = query.d[operation] as VQL_OP_UpdateOneOrAdd;
			permPaths.paths.push({
				c: PermCRUD.CREATE,
			});
			permPaths.paths.push({
				filed: extractPathsFromData(qo.search),
				p: PermCRUD.READ,
			});
			permPaths.paths.push({
				filed: extractPathsFromData(qo.updater),
				p: PermCRUD.UPDATE,
			});
			break;
		}

		case "toggleOne":
			permPaths.paths.push({
				c: PermCRUD.DELETE,
			});
			permPaths.paths.push({
				c: PermCRUD.CREATE,
			});
			break;

		case "ensureCollection":
		case "getCollections":
		case "issetCollection":
		case "removeCollection":
			permPaths.paths.push({
				c: PermCRUD.COLLECTION,
			});
			break;

		default: {
			const n: never = operation;
			break;
		}
	}

	permPaths.paths = (
		await Promise.all(
			permPaths.paths.map(async path => {
				if (!path.filed) return path;

				return await Promise.all(
					path.filed.map(async filed => {
						const processedPath = [
							query.db,
							collection,
							...processFieldPath(filed),
						];
						const hashedKey = await hashKey(config, processedPath);
						return {
							filed: hashedKey,
							path: processedPath,
							p: path.p,
						};
					}),
				);
			}),
		)
	).flat();

	return permPaths;
}

export function processFieldPath(pathObj: {
	path: string[];
	key: string;
}): string[] {
	let subsetMode = false;
	const processedPath: string[] = [];

	for (const part of pathObj.path) {
		if (subsetMode) {
			processedPath.push(part);
		} else {
			if (part.startsWith("$")) {
				if (part === "$subset") {
					subsetMode = true;
				}
			} else {
				processedPath.push(part);
			}
		}
	}

	if (subsetMode) {
		processedPath.push(pathObj.key);
	} else {
		if (!pathObj.key.startsWith("$")) {
			processedPath.push(pathObj.key);
		}
	}

	return processedPath;
}

export async function checkRequestPermission(
	config: VQLConfig,
	permValidFn: PermValidFn,
	user: any,
	query: VQL_Query_CRUD,
): Promise<boolean> {
	if (!query) return false;
	if (!user && config.permissionDeniedIfNoUser) return false;

	const permPaths = await extractPaths(config, query);

	// Helper function to recursively check permissions
	const checkPermissionRecursively = async (
		entityId: string,
		originalPath: string[],
		requiredPerm: number,
		fallbackLevels: string[] = [],
	): Promise<boolean> => {
		// Check if the user has access to the current entity
		const result = await permValidFn({
			field: entityId,
			path: originalPath,
			p: requiredPerm,
			user,
		});

		if (result.granted) {
			return true;
		}

		// If the result is "entity-404", check the next fallback level
		if (
			!config.strictACL &&
			result.reason === "entity-404" &&
			fallbackLevels.length > 0
		) {
			const nextFallbackLevels = fallbackLevels.slice(0, -1);
			if (nextFallbackLevels.length === 0) {
				return false;
			}
			const nextFallbackEntityId = await hashKey(config, nextFallbackLevels);
			return checkPermissionRecursively(
				nextFallbackEntityId,
				nextFallbackLevels,
				requiredPerm,
				nextFallbackLevels,
			);
		}

		// If no fallback levels are left or the result is not "entity-404", deny access
		return false;
	};

	// Check each required permission
	const results: boolean[] = [];
	for (const path of permPaths.paths) {
		let entityId: string;
		let requiredPerm: number;
		let fallbackLevels: string[] = [];
		let originalPath: string[] = [];

		if ("c" in path) {
			// Collection-level permission: hash the combination of db and collection
			entityId = await hashKey(config, [
				query.db,
				permPaths.c,
			]);
			requiredPerm = path.c;
			originalPath = [
				query.db,
				permPaths.c,
			];

			// Fallback to database level if needed
			fallbackLevels = [
				query.db,
			];
		} else {
			// Field-level permission: use the hashed field path
			entityId = path.filed;
			requiredPerm = path.p;
			originalPath = path.path;

			// Fallback to collection and then database level if needed
			fallbackLevels = path.path;
		}

		// Check permissions recursively
		const result = await checkPermissionRecursively(
			entityId,
			originalPath,
			requiredPerm,
			fallbackLevels,
		);
		results.push(result);
	}

	// All permissions must be granted
	return results.every(result => result);
}

function extractAllPaths(obj: any, prefix: string[] = []): string[][] {
	const paths: string[][] = [];
	for (const key of Object.keys(obj)) {
		const path = [
			...prefix,
			key,
		];
		paths.push(path);
		const value = obj[key];
		if (typeof value === "object" && value !== null && !Array.isArray(value)) {
			paths.push(...extractAllPaths(value, path));
		}
	}
	return paths;
}

export async function filterObjectByPermissions(
	config: VQLConfig,
	permValidFn: PermValidFn,
	user: any,
	db: string,
	collection: string,
	obj: Object,
): Promise<Object> {
	if (!obj || typeof obj !== "object") return obj;

	const allPaths = extractAllPaths(obj);

	const checkFieldPermission = async (
		path: string[],
	): Promise<{
		path: string[];
		granted: boolean;
	}> => {
		const fullPath = [
			db,
			collection,
			...path,
		];
		const hashedPath = await hashKey(config, fullPath);
		const result = await permValidFn({
			field: hashedPath,
			path: fullPath,
			p: PermCRUD.READ,
			user,
		});

		if (result.granted)
			return {
				path,
				granted: true,
			};

		if (
			!config.strictACL &&
			result.reason === "entity-404" &&
			path.length > 0
		) {
			const parentResult = await checkFieldPermission(path.slice(0, -1));
			return parentResult;
		}

		return {
			path,
			granted: false,
		};
	};

	const results = await Promise.all(allPaths.map(checkFieldPermission));

	const excludePaths = results
		.filter(r => !r.granted)
		.map(r => r.path.join("."));

	if (excludePaths.length === 0) return obj;

	return updateFindObject(obj, {
		exclude: excludePaths,
	});
}

export async function filterObjectsByPermissions(
	config: VQLConfig,
	permValidFn: PermValidFn,
	user: any,
	db: string,
	collection: string,
	objects: Object[],
): Promise<Object[]> {
	if (!Array.isArray(objects)) return objects;

	const result: Object[] = [];
	for (const obj of objects) {
		result.push(
			await filterObjectByPermissions(
				config,
				permValidFn,
				user,
				db,
				collection,
				obj,
			),
		);
	}
	return result;
}
