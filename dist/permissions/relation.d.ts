import { GateWarden } from "@wxn0brp/gate-warden";
import { RelationQuery } from "../types/vql.js";
import { VQLConfig } from "../config.js";
export declare function checkRelationPermission(config: VQLConfig, gw: GateWarden<any>, user: any, query: RelationQuery): Promise<boolean>;
