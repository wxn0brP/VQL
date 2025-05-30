import { VQLConfig } from "../config.js";
export declare function hashKey(config: VQLConfig, path: any): string;
export declare function extractPathsFromData(data: any, stack?: string[]): {
    path: string[];
    key: string;
}[];
