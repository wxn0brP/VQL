import { VQLConfig } from "../config";

let cryptoRef: typeof import("crypto") | null = null;

export async function getHash(json: string): Promise<string> {
    if (typeof window !== "undefined" && window.crypto?.subtle) {
        const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(json));
        return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, "0")).join("");
    } else {
        if (!cryptoRef) {
            cryptoRef = await import("crypto");
        }
        return cryptoRef.createHash("sha256").update(json).digest("hex");
    }
}

export async function hashKey(config: VQLConfig, path: any): Promise<string> {
    const json = JSON.stringify(path);
    if (config.hidePath)
        return await getHash(json);
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