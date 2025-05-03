import { VQL } from "../../types/vql";
import JSON5 from "json5";
import { extractMeta } from "./utils";
import { processVQL_MB } from "./middle";

export function parseVQLB(query: string): VQL {    
    const { db, op, collection, body } = extractMeta(query);
    const parsed = JSON5.parse(body);
    
    return processVQL_MB(db, op, collection, parsed);
}