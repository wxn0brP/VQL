import Ajv from "ajv";
import ajvFormat from "ajv-formats";
import { VQL, VQLR } from "./types/vql";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { VQLConfig } from "./config";

const fileUrl = dirname(import.meta.url).replace("file://", "") + "/schema.json";
let schema = null;

if (!existsSync(fileUrl)) {
    const TJS = await import("typescript-json-schema");

    const typesFile = dirname(import.meta.url).replace("file://", "") + "/types/vql.d.ts";
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
    writeFileSync(fileUrl, JSON.stringify(schema));
} else {
    schema = JSON.parse(readFileSync(fileUrl, "utf-8"));
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
        why = VQLConfig.formatAjv ? ajv.errorsText(why) : why;
        return { err: true, msg: "Invalid query raw", c: 400, why, rawQuery: query };
    }
    return true;
}

export function validateVql(query: VQL) {
    if (!validVQL(query)) {
        let why: any = validVQL.errors;
        why = VQLConfig.formatAjv ? ajv.errorsText(why) : why;
        return { err: true, msg: "Invalid query", c: 400, why, rawQuery: query };
    }
    return true;
}