import { GateWarden } from "@wxn0brp/gate-warden";
import { PermCRUD } from "../types/perm";
import { RelationQuery } from "../types/vql";
import { extractPathsFromData, hashKey } from "./utils";

export async function checkRelationPermission(
    gw: GateWarden<any>,
    user: any,
    query: RelationQuery
): Promise<boolean> {
    const { path, search, relations, select } = query.r;

    // Check permission for the relation field in the parent collection
    if (!await gw.hasAccess(user.id, hashKey(path), PermCRUD.READ)) {
        return false;
    }

    const searchPaths = extractPathsFromData(search || {});
    for (const searchPath of searchPaths) {        
        const key = [...path, ...searchPath.path, searchPath.key];
        const keyHash = hashKey(key);
        if (!await gw.hasAccess(user.id, keyHash, PermCRUD.READ)) {
            return false;
        }
    }

    // Check select fields permissions
    if (select) {
        for (const fieldPath of select) {
            const key = [...path, fieldPath];
            const keyHash = hashKey(key);
            if (!await gw.hasAccess(user.id, keyHash, PermCRUD.READ)) {
                return false;
            }
        }
    }

    // Check nested relations recursively
    if (relations) {
        for (const relationKey in relations) {
            const r = relations[relationKey];
            if (!await checkRelationPermission(gw, user, { r } as any)) {
                return false;
            }
        }
    }

    return true;
}
