import { VQL } from "../../types/vql";
import { processVQL_MB } from "./middle";
import { extractMeta } from "./utils";
import yaml from "js-yaml";

export function parseVQLM(query: string): VQL {
    const { db, op, collection } = extractMeta(query);

    let lineEndIndex = 0;
    let foundNonWhitespace = false;
    for (let i = 0; i < query.length; i++) {
        if (!foundNonWhitespace && query[i] !== " " && query[i] !== "\t" && query[i] !== "\r" && query[i] !== "\n") foundNonWhitespace = true;
        if (foundNonWhitespace && query[i] === "\n") {
            lineEndIndex = i;
            break;
        }
    }

    const body = query.slice(lineEndIndex + 1);
    const parsed = yaml.load(body);

    return processVQL_MB(db, op, collection, parsed);
}