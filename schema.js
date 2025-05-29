import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";
import TJS from "typescript-json-schema";

// @ts-check
const filePath = import.meta.dirname + "/dist/schema.json";
console.log("[VQL-engine] Generating schema to " + filePath);

const typesFile = import.meta.dirname + "/dist/vql.d.ts";
const program = TJS.getProgramFromFiles(
    [typesFile],
    {
        required: true
    },
    "./"
);
const schema = TJS.generateSchema(program, "VQLR", {
    required: true
});

const dir = dirname(filePath);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

writeFileSync(filePath, JSON.stringify(schema));