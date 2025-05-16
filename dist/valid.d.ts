import Ajv from "ajv";
import { VQL, VQLR } from "./types/vql.js";
export declare const ajv: Ajv;
export declare function validateRaw(query: VQLR): true | {
    err: boolean;
    msg: string;
    c: number;
    why: any;
    rawQuery: never;
};
export declare function validateVql(query: VQL): true | {
    err: boolean;
    msg: string;
    c: number;
    why: any;
    rawQuery: never;
};
