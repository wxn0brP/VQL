import { PermValidFn } from "../types/perm.js";
import { VQL_Query_Relation } from "../types/vql.js";
import { VQLConfig } from "../config.js";
export declare function checkRelationPermission(config: VQLConfig, permValidFn: PermValidFn, user: any, query: VQL_Query_Relation): Promise<boolean>;
