import { PermCRUD } from "../types/perm.js";
import { extractPathsFromData, hashKey } from "./utils.js";
export async function checkRelationPermission(config, validFn, user, query) {
    const { path, search, relations, select } = query.r;
    // Helper function to recursively check permissions with fallback mechanism
    const checkPermissionRecursively = async (entityId, fallbackLevels = []) => {
        // Check if the user has access to the current entity
        // const result = await gw.hasAccess(user.id, entityId, PermCRUD.READ);
        const result = await validFn(entityId, PermCRUD.READ, user);
        if (result.granted) {
            return true;
        }
        // If the result is "entity-404", check the next fallback level
        if (!config.strictACL && result.via === "entity-404" && fallbackLevels.length > 0) {
            const nextFallbackEntityId = await hashKey(config, fallbackLevels.slice(0, -1));
            return checkPermissionRecursively(nextFallbackEntityId, fallbackLevels.slice(0, -2));
        }
        // If no fallback levels are left or the result is not "entity-404", deny access
        return false;
    };
    // Check permission for the relation field in the parent collection
    if (!await checkPermissionRecursively(await hashKey(config, path), path)) {
        return false;
    }
    // Check permissions for search fields
    const searchPaths = extractPathsFromData(search || {});
    for (const searchPath of searchPaths) {
        const key = [...path, ...searchPath.path, searchPath.key];
        if (!await checkPermissionRecursively(await hashKey(config, key), key)) {
            return false;
        }
    }
    // Check permissions for select fields
    if (select) {
        for (const fieldPath of select) {
            const key = [...path, fieldPath];
            if (!await checkPermissionRecursively(await hashKey(config, key), key)) {
                return false;
            }
        }
    }
    // Recursively check nested relations
    if (relations) {
        for (const relationKey in relations) {
            const r = relations[relationKey];
            if (!await checkRelationPermission(config, validFn, user, { r })) {
                return false;
            }
        }
    }
    return true;
}
