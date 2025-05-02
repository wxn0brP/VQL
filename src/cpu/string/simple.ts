import { RelationTypes } from "@wxn0brp/db";
import { VQL } from "../../types/vql";
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

function parseArgs(input: string): Record<string, any> {
    const result: Record<string, any> = {};

    const lines = input.trim().split(/[\s=]+/);

    for (let i = 0; i < lines.length; i += 2) {
        const key = lines[i].trim();
        let value: any = lines[i + 1]?.trim() ?? "";

        if (!key) continue;

        if (value === "") {
            value = true;
        } else if (value.toLowerCase() === "true") {
            value = true;
        } else if (value.toLowerCase() === "false") {
            value = false;
        } else if (!isNaN(Number(value))) {
            value = Number(value);
        } else if (value.startsWith("{") && value.endsWith("}") || value.startsWith("[") && value.endsWith("]")) {
            try {
                value = JSON.parse(value);
            } catch {}
        }

        result[key] = value;
    }

    return result;
}

function buildVQL(db: string, op: string, collection: string, query: Record<string, any>): VQL {
    const hasRelations = "relations" in query;

    if (hasRelations) {
        const relations: RelationTypes.Relation = {};
        for (const key in query.relations) {
            const value = query.relations[key];
            relations[key] = {
                path: [value.db as any || db as string, value.c || key],
                ...value
            };
            delete (relations[key] as any).db;
            delete (relations[key] as any).c;

            if (value.select) {
                const select = [];
                for (const [keyS, val] of Object.entries(value.select)) {
                    if (val) select.push([key, keyS]);
                }
                relations[key].select = select;
            }
        }

        if ("select" in query) {
            const select = [];
            for (const [key, val] of Object.entries(query.select)) {
                if (val) select.push([key]);
            }
            query.select = select;
        }

        return {
            r: {
                path: [db, collection],
                ...query,
                relations,
            }
        } as any;
    } else {
        if (query.fields && !query.select) {
            query.select = query.fields;
            delete query.fields;
        }

        if ("select" in query) {
            const select = [];
            for (const [key, val] of Object.entries(query.select || [])) {
                if (val) select.push(key);
            }
            query.select = select;
        }
        return {
            db,
            d: {
                [op]: {
                    collection,
                    ...query,
                }
            }
        } as any
    }
}

export function parseVQLS(query: string): VQL {
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

    return buildVQL(db, op, collection, parsed);
}