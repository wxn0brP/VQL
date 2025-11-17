import { parseArgs } from "./args";
import { VQL_Query } from "../../types/vql";
import { buildVQL } from "./build";
import { extractMeta } from "./utils";

const aliases = {
    s: "search",
    f: "fields",
    o: "options",
    r: "relations",
    d: "data",
    e: "select",
    u: "updater",
}

export function parseVQLS(query: string): VQL_Query {
    const { db, op, collection, body } = extractMeta(query);
    const parsed = parseArgs(body);

    for (const keysRaw of Object.keys(parsed)) {
        const keys = keysRaw.split(".");
        if (keys.length === 1) {
            continue;
        }
        let obj = parsed;
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (i < keys.length - 1) {
                if (!(key in obj)) {
                    obj[key] = {};
                }
                obj = obj[key];
            } else {
                obj[key] = parsed[keysRaw];
                delete parsed[keysRaw];
            }
        }
    }

    for (const key in aliases) {
        if (key in parsed) {
            parsed[aliases[key]] = parsed[key];
            delete parsed[key];
        }
    }

    if ((op === "find" || op === "findOne") && !("search" in parsed)) {
        parsed.search = {};
    }

    if ((op === "update" || op === "remove") && !("updater" in parsed) && ("data" in parsed)) {
        parsed.updater = parsed.data;
        delete parsed.data;
    }

    return buildVQL(db, op, collection, parsed);
}