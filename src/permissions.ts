import { GateWarden } from "@wxn0brp/gate-warden";
import crypto from "crypto";
import { VQLWardenConfig } from "./config";
import { PermCRUD } from "./types/perm";
import { VQLFind, VQLFindOne, VQLQuery, VQLRequest, VQLUpdate, VQLUpdateOne, VQLUpdateOneOrAdd } from "./types/vql";

export function hashKey(path: any): string {
    const json = JSON.stringify(path);
    if (VQLWardenConfig.hidePath)
        return crypto.createHash("sha256").update(json).digest("hex");
    else
        return json;
}

export function extractPaths(query: VQLRequest): {
    db: string,
    c: string,
    paths: {
        filed?: string,
        p?: PermCRUD,
        c?: PermCRUD
    }[]
} {
    const operation = Object.keys(query.d)[0] as keyof VQLQuery;
    const collection = query.d[operation].collection;
    const permPaths = {
        db: hashKey(query.db),
        c: collection,
        paths: []
    }

    switch (operation) {
        case "f":
        case "find":
        case "findOne":
            const qf = query.d[operation] as VQLFind | VQLFindOne;
            permPaths.paths.push({ filed: extractPathsFromData(qf.search), p: PermCRUD.READ });
            break;
        case "add":
            permPaths.paths.push({ c: PermCRUD.CREATE });
            break;
        case "update":
        case "updateOne":
            const qu = query.d[operation] as VQLUpdate | VQLUpdateOne;
            permPaths.paths.push({ filed: extractPathsFromData(qu.search), p: PermCRUD.READ });
            permPaths.paths.push({ filed: extractPathsFromData(qu.updater), p: PermCRUD.UPDATE });
            break;
        case "remove":
        case "removeOne":
            permPaths.paths.push({ c: PermCRUD.DELETE });
            break;
        case "updateOneOrAdd":
            const qo = query.d[operation] as VQLUpdateOneOrAdd;
            permPaths.paths.push({ c: PermCRUD.CREATE });
            permPaths.paths.push({ filed: extractPathsFromData(qo.search), p: PermCRUD.READ });
            permPaths.paths.push({ filed: extractPathsFromData(qo.updater), p: PermCRUD.UPDATE });
            break;
    }

    permPaths.paths = permPaths.paths.map(path => {
        if (!path.filed) return path;

        return path.filed.map(filed => {
            const processedPath = [query.db, collection, ...processFieldPath(filed)];
            return { filed: hashKey(processedPath), p: path.p };
        });
    }).flat();

    return permPaths;
}

export function extractPathsFromData(data: any, stack: string[] = []): { path: string[]; key: string }[] {
    const paths: { path: string[]; key: string }[] = [];
    for (const key in data) {
        const value = data[key];
        if (typeof value === "object") {
            paths.push(...extractPathsFromData(value, [...stack, key]));
        } else {
            paths.push({ path: stack, key });
        }
    }
    return paths;
}

function processFieldPath(pathObj: { path: string[]; key: string }): string[] {
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

export async function checkRequestPermission(gw: GateWarden<any>, user: any, query: VQLRequest): Promise<boolean> {
    if (!query) return false;

    const permPaths = extractPaths(query);

    // Check each required permission
    const results: boolean[] = [];
    for (const path of permPaths.paths) {
        let entityId: string;
        let requiredPerm: number;

        if ("c" in path) {
            // Collection-level permission: hash the combination of db and collection
            entityId = hashKey([query.db, permPaths.c]);
            requiredPerm = path.c;
        } else {
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
