import { VQLConfig } from "../helpers/config.js";
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
export declare function filterObjectByPermissions(config: VQLConfig, permValidFn: PermValidFn, user: any, db: string, collection: string, obj: Object): Promise<Object>;
export declare function filterObjectsByPermissions(config: VQLConfig, permValidFn: PermValidFn, user: any, db: string, collection: string, objects: Object[]): Promise<Object[]>;
