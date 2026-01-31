import { VQLConfig } from "../helpers/config.js";
import { VQLProcessor } from "../processor.js";
import { VQL_Query_CRUD } from "../types/vql.js";
export declare function executeQuery(cpu: VQLProcessor, query: VQL_Query_CRUD, user: any, cfg: VQLConfig): Promise<any>;
