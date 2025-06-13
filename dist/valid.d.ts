import Ajv from "ajv";
import { VQLConfig } from "./config.js";
import { VQL, VQLError, VQLR } from "./types/vql.js";
export declare const ajv: Ajv;
export declare function validateRaw(config: VQLConfig, query: VQLR): true | VQLError;
export declare function validateVql(config: VQLConfig, query: VQL): true | VQLError;
