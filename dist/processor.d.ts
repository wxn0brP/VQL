import { Relation, ValtheraCompatible } from "@wxn0brp/db";
import { GateWarden } from "@wxn0brp/gate-warden";
import { VQL, VQLError, VQLR, VQLRef } from "./types/vql.js";
import { VQLConfig } from "./config.js";
export declare class VQLProcessor<GW = any> {
    dbInstances: Record<string, ValtheraCompatible>;
    gw: GateWarden<GW>;
    config: VQLConfig;
    relation: Relation;
    preDefinedSheets: Map<string, VQL>;
    constructor(dbInstances: Record<string, ValtheraCompatible>, gw?: GateWarden<GW>, config?: VQLConfig);
    execute<T = any>(queryRaw: VQLR | string | {
        query: string;
    } & VQLRef, user: any): Promise<T | VQLError>;
}
