import { VQLConfig } from "../helpers/config.js";
import { VQLProcessor } from "../processor.js";
import { VQL_Query_Relation } from "../types/vql.js";
export declare function executeRelation(cpu: VQLProcessor, query: VQL_Query_Relation, user: any, cfg: VQLConfig): Promise<any>;
