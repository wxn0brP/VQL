import { VQLConfig } from "../config.js";
export declare function getHash(json: string): Promise<string>;
export declare function hashKey(config: VQLConfig, path: any): Promise<string>;
export declare function extractPathsFromData(data: any, stack?: string[]): {
    path: string[];
    key: string;
}[];
