import { extractMeta } from "./utils.js";
import JSON5 from "json5";
import { convertSearchObjToSearchArray } from "./middle.js";
const aliases = {
    s: "search",
    f: "fields",
    o: "options",
    r: "relations",
    d: "data",
    e: "select",
    u: "updater",
};
function parseArgs(input) {
    const result = {};
    const tokens = [];
    let current = "";
    let inQuotes = false;
    let escape = false;
    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        if (escape) {
            current += char;
            escape = false;
        }
        else if (char === "\\") {
            escape = true;
        }
        else if (char === "\"") {
            inQuotes = !inQuotes;
        }
        else if (!inQuotes && (char === " " || char === "=")) {
            if (current !== "") {
                tokens.push(current);
                current = "";
            }
        }
        else {
            current += char;
        }
    }
    if (current !== "") {
        tokens.push(current);
    }
    for (let i = 0; i < tokens.length; i += 2) {
        const key = tokens[i];
        let value = tokens[i + 1] ?? true;
        if (typeof value === "string") {
            const trimmed = value.trim();
            if (trimmed === "") {
                value = true;
            }
            else if (/^".*"$/.test(trimmed)) {
                value = trimmed.slice(1, -1);
            }
            else if (trimmed.toLowerCase() === "true") {
                value = true;
            }
            else if (trimmed.toLowerCase() === "false") {
                value = false;
            }
            else if (!isNaN(Number(trimmed))) {
                value = Number(trimmed);
            }
            else if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
                try {
                    value = JSON5.parse(trimmed);
                }
                catch { }
            }
        }
        result[key] = value;
    }
    return result;
}
function buildVQL(db, op, collection, query) {
    const hasRelations = "relations" in query;
    if (hasRelations) {
        const relations = {};
        for (const key in query.relations) {
            const value = query.relations[key];
            relations[key] = {
                path: [value.db || db, value.c || key],
                ...value
            };
            delete relations[key].db;
            delete relations[key].c;
        }
        if ("select" in query) {
            query.select = convertSearchObjToSearchArray(query.select);
        }
        return {
            r: {
                path: [db, collection],
                ...query,
                relations,
            }
        };
    }
    else {
        if (query.fields && !query.select) {
            query.select = query.fields;
            delete query.fields;
        }
        if ("select" in query) {
            query.select = [...new Set(convertSearchObjToSearchArray(query.select).map(k => k[0]).flat())];
        }
        return {
            db,
            d: {
                [op]: {
                    collection,
                    ...query,
                }
            }
        };
    }
}
export function parseVQLS(query) {
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
            }
            else {
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
//# sourceMappingURL=simple.js.map