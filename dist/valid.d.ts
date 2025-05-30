import Ajv from "ajv";
import { VQLConfig } from "./config.js";
import { VQL, VQLR } from "./types/vql.js";
export declare const ajv: Ajv;
export declare function validateRaw(config: VQLConfig, query: VQLR): true | {
    err: boolean;
    msg: string;
    c: number;
    why: any;
};
export declare function validateVql(config: VQLConfig, query: VQL): true | {
    err: boolean;
    msg: string;
    c: number;
    why: any;
};
