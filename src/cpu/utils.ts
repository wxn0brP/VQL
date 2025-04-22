import { VQLConfig } from "../config";

export function parseSelect(select: object | object[]) {
    if (Array.isArray(select)) {
        if (!VQLConfig.strictSelect && select.length === 0) return undefined;
        return select;
    } else {
        const keys = Object.keys(select);
        if (!VQLConfig.strictSelect && keys.length === 0) return undefined;
        return keys.filter(k => !!select[k]);
    }
}