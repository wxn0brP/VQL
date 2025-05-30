import crypto from "crypto";
import { VQLConfig } from "../config";

export function hashKey(config: VQLConfig, path: any): string {
    const json = JSON.stringify(path);
    if (config.hidePath)
        return crypto.createHash("sha256").update(json).digest("hex");
    else
        return json;
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