import { VQLConfig } from "../config.js";
import { PermCRUD, PermValidFn } from "../types/perm.js";
import { VQL_Query_CRUD } from "../types/vql.js";
export declare function extractPaths(config: VQLConfig, query: VQL_Query_CRUD): Promise<{
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
export declare function checkRequestPermission(config: VQLConfig, permValidFn: PermValidFn, user: any, query: VQL_Query_CRUD): Promise<boolean>;
