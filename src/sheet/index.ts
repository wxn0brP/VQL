import { deepMerge } from "../merge";
import { VQL, VQLR } from "../types/vql";
import { RelationTypes } from "@wxn0brp/db";

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
    if (typeof obj === "string") {
        if (obj.startsWith("$")) {
            return variables[obj.slice(1)] || variables[obj];
        }
        return obj;
    } else if (Array.isArray(obj)) {
        return obj.map((item: any) => replaceVariables(item, variables));
    } else if (typeof obj === "object") {
        const newObj: any = {};
        for (const key in obj) {
            newObj[key] = replaceVariables(obj[key], variables);
        }
        return newObj;
    } else {
        return obj;
    }
}

export function executeSheet(query: VQLR, preDefinedSheets: Map<string, VQL>): VQL {
    if ("ref" in query) {
        if (preDefinedSheets.has(query.ref)) {
            const ref = preDefinedSheets.get(query.ref);
            const merge = deepMerge(query, ref) as VQL;
            pathFix(merge);
            query = merge;
        }
        delete query.ref;
    }

    if ("var" in query) {
        query = replaceVariables(query, query.var);
        delete query.var;
    }

    return query as VQL;
}