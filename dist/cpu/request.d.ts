import { VQLProcessor } from "../processor.js";
import { VQLRequest } from "../types/vql.js";
export declare function executeQuery(cpu: VQLProcessor, query: VQLRequest, user: any): Promise<any>;
