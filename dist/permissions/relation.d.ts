import { GateWarden } from "@wxn0brp/gate-warden";
import { RelationQuery } from "../types/vql.js";
export declare function checkRelationPermission(gw: GateWarden<any>, user: any, query: RelationQuery): Promise<boolean>;
