import { ValidFn } from "../types/perm.js";
import { RelationQuery } from "../types/vql.js";
import { VQLConfig } from "../config.js";
export declare function checkRelationPermission(config: VQLConfig, validFn: ValidFn, user: any, query: RelationQuery): Promise<boolean>;
