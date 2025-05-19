import Ajv from "ajv";
import ajvFormat from "ajv-formats";
import { VQL, VQLR } from "./types/vql";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { VQLConfig } from "./config";
import { buildAjvErrorTree } from "./ajv";
import { deepMerge } from "@wxn0brp/wts-deep-merge";

const filePath = import.meta.dirname + "/schema.json";
let schema = null;

if (!existsSync(filePath)) {
    console.log("[VQL-engine] Generating schema to " + filePath);
    const TJS = await import("typescript-json-schema");

    const typesFile = import.meta.dirname + "/types/vql.d.ts";
    const program = TJS.getProgramFromFiles(
        [typesFile],
        {
            required: true
        },
        "./"
    );
    schema = TJS.generateSchema(program, "VQLR", {
        required: true
    });

    const dir = dirname(filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    writeFileSync(filePath, JSON.stringify(schema));
} else {
    schema = JSON.parse(readFileSync(filePath, "utf-8"));
}

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

export function validateRaw(query: VQLR) {
    if (!validVQLR(query)) {
        let why: any = validVQLR.errors;
        why = VQLConfig.formatAjv ? buildAjvErrorTree(why) : why;
        why = deepMerge(why, query);
        return { err: true, msg: "Invalid query raw", c: 400, why };
    }
    return true;
}

export function validateVql(query: VQL) {
    if (!validVQL(query)) {
        let why: any = validVQL.errors;
        why = VQLConfig.formatAjv ? buildAjvErrorTree(why) : why;
        why = deepMerge(why, query);
        return { err: true, msg: "Invalid query", c: 400, why };
    }
    return true;
}