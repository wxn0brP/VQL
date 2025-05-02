import { VQL } from "../../types/vql";
import JSON5 from "json5";
import { extractMeta } from "./utils";

export function parseVQLB(query: string): VQL {    
    const { db, op, collection, body } = extractMeta(query);
    const parsed = JSON5.parse(body);
    
    if ("relations" in parsed) {
        return {
            r: {
                path: [parsed.db || db, parsed.c || collection],
                ...parsed
            }
        } as any;
    } else {
        return {
            db,
            d: {
                [op]: {
                    collection,
                    ...parsed
                }
            }
        } as any;
    }
}