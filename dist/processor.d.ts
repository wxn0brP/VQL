import { Relation, ValtheraCompatible } from "@wxn0brp/db-core";
import { VQLConfig, VQLConfigInterface } from "./config.js";
import { VQLError, VQLUQ } from "./types/vql.js";
import { PermValidFn } from "./types/perm.js";
export declare class VQLProcessor {
    dbInstances: Record<string, ValtheraCompatible>;
    permValidFn: PermValidFn;
    relation: Relation;
    config: VQLConfig;
    constructor(dbInstances: Record<string, ValtheraCompatible>, config?: VQLConfig | Partial<VQLConfigInterface>, permValidFn?: PermValidFn);
    execute<T = any>(queryRaw: VQLUQ<T>, user?: any): Promise<T | VQLError>;
}
