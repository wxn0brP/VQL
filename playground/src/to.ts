import { VQL, VQLFind, VQLQueryData } from "#src/types/vql";
import { shortOpsCheckbox, useObjectSelectCheckbox } from "./html";
import JSON5 from "json5";

const shortMap = {
    "find": "",
    "add": "+",
    "update": "=",
    "remove": "-"
} as const;
const shortArray = Object.keys(shortMap);

export function op(vql: VQL) {
    if ("r" in vql) {
        const value = vql.r;
        return opValue(value.path[0], value.path[1], value.many ? "find" : "findOne");
    } else if ("d" in vql) {
        const key = Object.keys(vql.d)[0];
        const data = vql.d as VQLQueryData;
        const value: VQLFind = data[key];
        return opValue(vql.db, value.collection, key);
    }
}

export function opValue(db: string, collection: string, op: string) {
    if (shortOpsCheckbox.checked) {
        const opRaw = op.replace("One", "");
        if (shortArray.includes(opRaw)) {
            const shortOp = shortMap[opRaw];
            return `${db} ${shortOp}${collection}${op === "findOne" ? "!" : ""}`;
        }
    }

    return `${db} ${op} ${collection}`;
}

export function convertSelectArrayToSelectObj(arr: string[][]): Record<string, any> {
    return arr.reduce((acc, path) => {
        let current = acc;

        for (let i = 0; i < path.length - 1; i++) {
            const key = path[i];
            if (!current[key]) {
                current[key] = {};
            }
            current = current[key];
        }

        const lastKey = path[path.length - 1];
        current[lastKey] = 1;

        return acc;
    }, {});
}

export function standardizeVQLR(vqlr: VQL) {
    if ("r" in vqlr) {

        if (useObjectSelectCheckbox.checked) {
            const select = vqlr.r.select;
            if (select && Array.isArray(select)) {
                vqlr.r.select = convertSelectArrayToSelectObj(select) as any;
            }
        }

        const newQuery: Record<string, any> = {};

        for (const [k, v] of Object.entries(vqlr.r)) {
            if (k === "path") continue;
            if (v) newQuery[k] = v;
        }
        return newQuery;

    } else if ("d" in vqlr) {
        const key = Object.keys(vqlr.d)[0];

        if (useObjectSelectCheckbox.checked) {
            const select = vqlr.d[key].select;
            if (select && Array.isArray(select)) {
                vqlr.d[key].select = convertSelectArrayToSelectObj(select);
            }
        }

        const newQuery: Record<string, any> = {};

        for (const [k, v] of Object.entries(vqlr.d[key])) {
            if (k === "collection") continue;
            if (v) newQuery[k] = v;
        }
        return newQuery;
    }

    return vqlr;
}

export function generateKeyValues(obj: Record<string, any>, parentKeys: string[] = []): string[] {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        const path = [...parentKeys, key];

        if (value === null) 
            return [...acc, `${path.join('.')} = null`];

        else if (typeof value === 'object' && !Array.isArray(value)) 
            return [...acc, ...generateKeyValues(value, path)];

        else if (Array.isArray(value)) 
            return [...acc, `${path.join('.')} = ${JSON5.stringify(value)}`];

        else 
            return [...acc, `${path.join('.')} = ${value}`];

    }, [] as string[]);
}