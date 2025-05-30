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