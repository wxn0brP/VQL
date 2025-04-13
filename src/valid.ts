import Ajv from 'ajv';
import ajvFormat from "ajv-formats";
import { VQL, VQLR } from './types/vql';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from "path";

const fileUrl = dirname(import.meta.url).replace("file://", "") + "/schema.json";
let schema = null;

if (!existsSync(fileUrl)) {
    const TJS = await import("typescript-json-schema");

    const program = TJS.getProgramFromFiles(
        [resolve("src/types/vql.ts")],
        {
            required: true
        },
        "./"
    );
    schema = TJS.generateSchema(program, "VQLRawRequest", {
        required: true
    });

    writeFileSync(fileUrl, JSON.stringify(schema));
} else {
    schema = JSON.parse(readFileSync(fileUrl, "utf-8"));
}

export const ajv = new Ajv({
    allowUnionTypes: true
});
ajvFormat(ajv);

const validRawRequest = ajv.compile(schema);

const modSchema = schema;
modSchema.anyOf = [
    {
        "$ref": "#/definitions/VQL"
    }
]
const validVQL = ajv.compile(modSchema);

export function validateRaw(query: VQLR) {
    if (!validRawRequest(query)) {
        console.error(validRawRequest.errors);
        return false;
    }
    return true;
}

export function validateVql(query: VQL) {
    if (!validVQL(query)) {
        console.error(validVQL.errors);
        return false;
    }
    return true;
}