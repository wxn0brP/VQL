import { VQLConfig } from "../config";
import { PermCRUD, PermValidFn } from "../types/perm";
import { VQL_OP_Find, VQL_OP_FindOne, VQL_OP_Update, VQL_OP_UpdateOneOrAdd, VQL_Query_CRUD } from "../types/vql";
import { extractPathsFromData, hashKey } from "./utils";

export async function extractPaths(config: VQLConfig, query: VQL_Query_CRUD): Promise<{
    db: string,
    c: string,
    paths: {
        filed?: string,
        p?: PermCRUD,
        c?: PermCRUD,
        path?: string[]
    }[]
}> {
    const operation = Object.keys(query.d)[0];
    const collection = query.d[operation].collection;
    const permPaths = {
        db: await hashKey(config, query.db),
        c: collection,
        paths: []
    }

    switch (operation) {
        case "f":
        case "find":
        case "findOne":
            const qf = query.d[operation] as VQL_OP_Find | VQL_OP_FindOne;
            permPaths.paths.push({ filed: extractPathsFromData(qf.search), p: PermCRUD.READ });
            break;
        case "add":
            permPaths.paths.push({ c: PermCRUD.CREATE });
            break;
        case "update":
        case "updateOne":
            const qu = query.d[operation] as VQL_OP_Update;
            permPaths.paths.push({ filed: extractPathsFromData(qu.search), p: PermCRUD.READ });
            permPaths.paths.push({ filed: extractPathsFromData(qu.updater), p: PermCRUD.UPDATE });
            break;
        case "remove":
        case "removeOne":
            permPaths.paths.push({ c: PermCRUD.DELETE });
            break;
        case "updateOneOrAdd":
            const qo = query.d[operation] as VQL_OP_UpdateOneOrAdd;
            permPaths.paths.push({ c: PermCRUD.CREATE });
            permPaths.paths.push({ filed: extractPathsFromData(qo.search), p: PermCRUD.READ });
            permPaths.paths.push({ filed: extractPathsFromData(qo.updater), p: PermCRUD.UPDATE });
            break;
        case "ensureCollection":
        case "getCollections":
        case "issetCollection":
        case "removeCollection":
            permPaths.paths.push({ c: PermCRUD.COLLECTION });
            break;
    }

    permPaths.paths = (await Promise.all(
        permPaths.paths.map(async (path) => {
            if (!path.filed) return path;

            return await Promise.all(
                path.filed.map(async (filed) => {
                    const processedPath = [query.db, collection, ...processFieldPath(filed)];
                    const hashedKey = await hashKey(config, processedPath);
                    return { filed: hashedKey, path: processedPath, p: path.p };
                })
            );
        })
    )).flat();

    return permPaths;
}

export function processFieldPath(pathObj: { path: string[]; key: string }): string[] {
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
    query: VQL_Query_CRUD
): Promise<boolean> {
    if (!query) return false;

    const permPaths = await extractPaths(config, query);

    // Helper function to recursively check permissions
    const checkPermissionRecursively = async (
        entityId: string,
        originalPath: string[],
        requiredPerm: number,
        fallbackLevels: string[] = []
    ): Promise<boolean> => {
        // Check if the user has access to the current entity
        // const result = await gw.hasAccess(user.id, entityId, requiredPerm);
        const result = await permValidFn({
            field: entityId,
            path: originalPath,
            p: requiredPerm,
            user
        });

        if (result.granted) {
            return true;
        }

        // If the result is "entity-404", check the next fallback level
        if (!config.strictACL && result.via === "entity-404" && fallbackLevels.length > 0) {
            const nextFallbackEntityId = await hashKey(config, fallbackLevels.slice(0, -1));
            return checkPermissionRecursively(nextFallbackEntityId, fallbackLevels.slice(0, -2), requiredPerm, fallbackLevels.slice(0, -2));
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
            entityId = await hashKey(config, [query.db, permPaths.c]);
            requiredPerm = path.c;
            originalPath = [query.db, permPaths.c];

            // Fallback to database level if needed
            fallbackLevels = [query.db];
        } else {
            // Field-level permission: use the hashed field path
            entityId = path.filed;
            requiredPerm = path.p;
            originalPath = path.path;

            // Fallback to collection and then database level if needed
            fallbackLevels = path.path;
        }

        // Check permissions recursively
        const result = await checkPermissionRecursively(entityId, originalPath, requiredPerm, fallbackLevels);
        results.push(result);
    }

    // All permissions must be granted
    return results.every(result => result);
}