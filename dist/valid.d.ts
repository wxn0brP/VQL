import { VQL, VQLError, VQLR } from "./types/vql.js";
export declare function validateRaw(query: VQLR): true | VQLError;
export declare function validateVql(query: VQL): true | VQLError;
