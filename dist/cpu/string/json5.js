import JSON5 from "json5";
import { extractMeta } from "./utils.js";
import { processVQL_MB } from "./middle.js";
export function parseVQLB(query) {
    const { db, op, collection, body } = extractMeta(query);
    const parsed = JSON5.parse(body);
    return processVQL_MB(db, op, collection, parsed);
}
