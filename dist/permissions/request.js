import { PermCRUD } from "../types/perm.js";
import { extractPathsFromData, hashKey } from "./utils.js";
export function extractPaths(query) {
    const operation = Object.keys(query.d)[0];
    const collection = query.d[operation].collection;
    const permPaths = {
        db: hashKey(query.db),
        c: collection,
        paths: []
    };
    switch (operation) {
        case "f":
        case "find":
        case "findOne":
            const qf = query.d[operation];
            permPaths.paths.push({ filed: extractPathsFromData(qf.search), p: PermCRUD.READ });
            break;
        case "add":
            permPaths.paths.push({ c: PermCRUD.CREATE });
            break;
        case "update":
        case "updateOne":
            const qu = query.d[operation];
            permPaths.paths.push({ filed: extractPathsFromData(qu.search), p: PermCRUD.READ });
            permPaths.paths.push({ filed: extractPathsFromData(qu.updater), p: PermCRUD.UPDATE });
            break;
        case "remove":
        case "removeOne":
            permPaths.paths.push({ c: PermCRUD.DELETE });
            break;
        case "updateOneOrAdd":
            const qo = query.d[operation];
            permPaths.paths.push({ c: PermCRUD.CREATE });
            permPaths.paths.push({ filed: extractPathsFromData(qo.search), p: PermCRUD.READ });
            permPaths.paths.push({ filed: extractPathsFromData(qo.updater), p: PermCRUD.UPDATE });
            break;
    }
    permPaths.paths = permPaths.paths.map(path => {
        if (!path.filed)
            return path;
        return path.filed.map(filed => {
            const processedPath = [query.db, collection, ...processFieldPath(filed)];
            return { filed: hashKey(processedPath), p: path.p };
        });
    }).flat();
    return permPaths;
}
export function processFieldPath(pathObj) {
    let subsetMode = false;
    const processedPath = [];
    for (const part of pathObj.path) {
        if (subsetMode) {
            processedPath.push(part);
        }
        else {
            if (part.startsWith("$")) {
                if (part === "$subset") {
                    subsetMode = true;
                }
            }
            else {
                processedPath.push(part);
            }
        }
    }
    if (subsetMode) {
        processedPath.push(pathObj.key);
    }
    else {
        if (!pathObj.key.startsWith("$")) {
            processedPath.push(pathObj.key);
        }
    }
    return processedPath;
}
export async function checkRequestPermission(gw, user, query) {
    if (!query)
        return false;
    const permPaths = extractPaths(query);
    // Check each required permission
    const results = [];
    for (const path of permPaths.paths) {
        let entityId;
        let requiredPerm;
        if ("c" in path) {
            // Collection-level permission: hash the combination of db and collection
            entityId = hashKey([query.db, permPaths.c]);
            requiredPerm = path.c;
        }
        else {
            // Field-level permission: use the hashed field path
            entityId = path.filed;
            requiredPerm = path.p;
        }
        // Check if user has the required permission on the entity
        const result = await gw.hasAccess(user.id, entityId, requiredPerm);
        results.push(result);
    }
    // All permissions must be granted
    return results.every(result => result);
}
//# sourceMappingURL=request.js.map