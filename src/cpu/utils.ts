import { VQLConfig } from "../config";

export function parseSelect(config: VQLConfig, select: object | object[]) {
    if (Array.isArray(select)) {
        if (!config.strictSelect && select.length === 0) return undefined;
        return select;
    } else {
        const keys = Object.keys(select);
        if (!config.strictSelect && keys.length === 0) return undefined;
        return keys.filter(k => !!select[k]);
    }
}

export function parseObjectSelect(obj: object) {
    if (Array.isArray(obj)) return obj;
    let result: string[][] = [];

    function walk(o: any, path: string[] = []) {
        if (o !== null && typeof o === "object") {
            for (const k of Object.keys(o)) {
                walk(o[k], [...path, k]);
            }
        } else {
            result.push(path);
        }
    }

    walk(obj);
    return result;
}