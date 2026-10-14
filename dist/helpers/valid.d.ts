import { VQLConfig } from "./config.js";
import { VQL_Query, VQLError } from "../types/vql.js";
export declare function validateRaw(query: VQL_Query): true | VQLError;
export declare function validateVql(query: VQL_Query, cfg?: VQLConfig): true | VQLError;
