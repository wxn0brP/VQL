import { Relation, ValtheraCompatible } from "@wxn0brp/db-core";
import { VQLConfig, VQLConfigInterface } from "./config.js";
import { VQL, VQLError, VqlQueryRaw } from "./types/vql.js";
import { ValidFn } from "./types/perm.js";
export declare class VQLProcessor {
    dbInstances: Record<string, ValtheraCompatible>;
    validFn: ValidFn;
    relation: Relation;
    preDefinedSheets: Map<string, VQL>;
    config: VQLConfig;
    constructor(dbInstances: Record<string, ValtheraCompatible>, config?: VQLConfig | Partial<VQLConfigInterface>, validFn?: ValidFn);
    execute<T = any>(queryRaw: VqlQueryRaw<T>, user?: any): Promise<T | VQLError>;
}
