import { VQLProcessor } from "../processor.js";
import { RelationQuery } from "../types/vql.js";
export declare function executeRelation(cpu: VQLProcessor, query: RelationQuery, user: any): Promise<any>;
