import { Relation, ValtheraCompatible } from "@wxn0brp/db";
import { GateWarden } from "@wxn0brp/gate-warden";
import { VQL, VQLR, VQLRef } from "./types/vql.js";
export declare class VQLProcessor<GW = any> {
    dbInstances: Record<string, ValtheraCompatible>;
    gw: GateWarden<GW>;
    relation: Relation;
    preDefinedSheets: Map<string, VQL>;
    constructor(dbInstances: Record<string, ValtheraCompatible>, gw?: GateWarden<GW>);
    execute(queryRaw: VQLR | string | {
        query: string;
    } & VQLRef, user: any): Promise<any>;
}
