import Ajv from 'ajv';
import ajvFormat from "ajv-formats";
import { VQL } from './types/vql';
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
    schema = TJS.generateSchema(program, "VQL", {
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
const validateFn = ajv.compile(schema);

function validate(query: VQL) {
    if (!validateFn(query)) {
        console.error(validateFn.errors);
        return false;
    }
    return true;
}

export default validate;