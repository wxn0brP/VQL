import crypto from "crypto";
export function hashKey(config, path) {
    const json = JSON.stringify(path);
    if (config.hidePath)
        return crypto.createHash("sha256").update(json).digest("hex");
    else
        return json;
}
export function extractPathsFromData(data, stack = []) {
    const paths = [];
    for (const key in data) {
        const value = data[key];
        if (typeof value === "object") {
            paths.push(...extractPathsFromData(value, [...stack, key]));
        }
        else {
            paths.push({ path: stack, key });
        }
    }
    return paths;
}
//# sourceMappingURL=utils.js.map