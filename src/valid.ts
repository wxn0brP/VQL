import { deepMerge } from "@wxn0brp/wts-deep-merge";
import Ajv from "ajv";
import ajvFormat from "ajv-formats";
import { readFileSync } from "fs";
import { buildAjvErrorTree } from "./ajv";
import { VQLConfig } from "./config";
import { VQL, VQLR } from "./types/vql";

const filePath = import.meta.dirname + "/schema.json";
const schema = JSON.parse(readFileSync(filePath, "utf-8"));

export const ajv = new Ajv({
    allowUnionTypes: true,
    strict: false
});
ajvFormat(ajv);

const validVQLR = ajv.compile(schema);

const modSchema = schema;
modSchema.anyOf = [
    {
        "$ref": "#/definitions/VQL"
    }
]
const validVQL = ajv.compile(modSchema);

export function validateRaw(config:VQLConfig, query: VQLR) {
    if (!validVQLR(query)) {
        let why: any = validVQLR.errors;
        why = config.formatAjv ? buildAjvErrorTree(why) : why;
        why = deepMerge(why, query);
        return { err: true, msg: "Invalid query raw", c: 400, why };
    }
    return true;
}

export function validateVql(config:VQLConfig, query: VQL) {
    if (!validVQL(query)) {
        let why: any = validVQL.errors;
        why = config.formatAjv ? buildAjvErrorTree(why) : why;
        why = deepMerge(why, query);
        return { err: true, msg: "Invalid query", c: 400, why };
    }
    return true;
}