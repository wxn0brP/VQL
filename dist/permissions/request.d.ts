import { PermCRUD, ValidFn } from "../types/perm.js";
import { VQLRequest } from "../types/vql.js";
import { VQLConfig } from "../config.js";
export declare function extractPaths(config: VQLConfig, query: VQLRequest): Promise<{
    db: string;
    c: string;
    paths: {
        filed?: string;
        p?: PermCRUD;
        c?: PermCRUD;
        path?: string[];
    }[];
}>;
export declare function processFieldPath(pathObj: {
    path: string[];
    key: string;
}): string[];
export declare function checkRequestPermission(config: VQLConfig, validFn: ValidFn, user: any, query: VQLRequest): Promise<boolean>;
