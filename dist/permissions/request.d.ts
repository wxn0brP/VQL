import { GateWarden } from "@wxn0brp/gate-warden";
import { PermCRUD } from "../types/perm.js";
import { VQLRequest } from "../types/vql.js";
export declare function extractPaths(query: VQLRequest): {
    db: string;
    c: string;
    paths: {
        filed?: string;
        p?: PermCRUD;
        c?: PermCRUD;
        path?: string[];
    }[];
};
export declare function processFieldPath(pathObj: {
    path: string[];
    key: string;
}): string[];
export declare function checkRequestPermission(gw: GateWarden<any>, user: any, query: VQLRequest): Promise<boolean>;
