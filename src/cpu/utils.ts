import { VQLConfig } from "../helpers/config";

export function parseSelect(config: VQLConfig, select: object | object[]) {
    if (Array.isArray(select)) {
        if (!config.strictSelect && select.length === 0) return undefined;
        return select;
    } else if (typeof select === "object") {
        const keys = Object.keys(select);
        if (!config.strictSelect && keys.length === 0) return undefined;
        return keys.filter(k => !!select[k]);
    } else {
        return config.strictSelect ? [] : undefined;
    }
}