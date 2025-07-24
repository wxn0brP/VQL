import { Relation, ValtheraCompatible } from "@wxn0brp/db-core";
import { GateWarden } from "@wxn0brp/gate-warden";
import { VQLConfig } from "./config.js";
import { VQL, VQLError, VqlQueryRaw } from "./types/vql.js";
export declare class VQLProcessor<GW = any> {
    dbInstances: Record<string, ValtheraCompatible>;
    gw: GateWarden<GW>;
    config: VQLConfig;
    relation: Relation;
    preDefinedSheets: Map<string, VQL>;
    constructor(dbInstances: Record<string, ValtheraCompatible>, gw?: GateWarden<GW>, config?: VQLConfig);
    execute<T = any>(queryRaw: VqlQueryRaw<T>, user: any): Promise<T | VQLError>;
}
