import { Relation, ValtheraCompatible } from "@wxn0brp/db-core";
import { VQLConfig, VQLConfigInterface } from "./config.js";
import { VQL_Query, VQLError, VQLUQ } from "./types/vql.js";
import { PermValidFn } from "./types/perm.js";
export declare class VQLProcessor {
    dbInstances: Record<string, ValtheraCompatible>;
    permValidFn: PermValidFn;
    relation: Relation;
    config: VQLConfig;
    constructor(dbInstances: Record<string, ValtheraCompatible>, config?: VQLConfig | Partial<VQLConfigInterface>, permValidFn?: PermValidFn);
    execute<T = any>(queryRaw: VQLUQ<T>, user?: any): Promise<T | VQLError>;
    _preProcessQuery(queryRaw: VQLUQ, user: any): {
        err: VQLError;
        query?: undefined;
    } | {
        query: VQL_Query;
        err?: undefined;
    };
    _parseQuery(queryRaw: VQLUQ): {
        query?: VQL_Query;
        err?: VQLError;
    };
    _runQuery(query: VQL_Query, user: any): Promise<any>;
}
