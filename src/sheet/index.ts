import { deepMerge } from "../merge";
import { VQL, VQLR } from "../types/vql";
import { RelationTypes } from "@wxn0brp/db-core";

function trimPath(path: RelationTypes.Path | undefined): RelationTypes.Path | undefined {
    return path && path.length > 2 ? path.slice(0, 2) as RelationTypes.Path : path;
}

function relationFix(relations: RelationTypes.Relation) {
    for (const key in relations) {
        const value = relations[key];
        value.path = trimPath(value.path);
        if (value.relations) {
            relationFix(value.relations);
        }
    }
}

function pathFix(vql: VQL) {
    if ("d" in vql) {
        const key = Object.keys(vql.d)[0];
        const value = vql.d[key];
        value.path = trimPath(value.path);
    } else if ("r" in vql) {
        const value = vql.r;
        value.path = trimPath(value.path);
        if (value.relations) {
            relationFix(value.relations);
        }
    }
}

function replaceVariables(obj: any, variables: Record<string, any>): any {
    if (typeof obj === "object" && !Array.isArray(obj) && obj !== null && "__" in obj) {
        const varKey = obj.__;
        return variables[varKey] ?? obj;
    }

    if (typeof obj === "string") {
        if (obj.startsWith("$")) 
            return variables[obj.slice(1)] ?? obj;
        
        return obj;
    }

    if (Array.isArray(obj))
        return obj.map((item) => replaceVariables(item, variables));

    if (typeof obj === "object" && obj !== null) {
        const newObj: any = {};
        for (const key in obj) {
            newObj[key] = replaceVariables(obj[key], variables);
        }
        return newObj;
    }

    return obj;
}

export function executeSheetAndReplaceVars(query: VQLR, preDefinedSheets: Map<string, VQL>, user: any): VQL {
    if ("ref" in query) {
        if (preDefinedSheets.has(query.ref)) {
            const ref = preDefinedSheets.get(query.ref);
            const merge = deepMerge(query, ref) as VQL;
            pathFix(merge);
            query = merge;
        }
        delete query.ref;
    }

    query.var = {
        _me: user?.id || user?._id || user,
        _now: Date.now(),
        _nowShort: Math.floor(Date.now() / 1000),
        __now: Date.now().toString(),
        __nowShort: Math.floor(Date.now() / 1000).toString(),
        ...(query.var || {})
    }
    query = replaceVariables(query, query.var);
    delete query.var;

    return query as VQL;
}