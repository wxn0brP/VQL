import { deepMerge } from "../merge.js";
function trimPath(path) {
    return path && path.length > 2 ? path.slice(0, 2) : path;
}
function relationFix(relations) {
    for (const key in relations) {
        const value = relations[key];
        value.path = trimPath(value.path);
        if (value.relations) {
            relationFix(value.relations);
        }
    }
}
function pathFix(vql) {
    if ("d" in vql) {
        const key = Object.keys(vql.d)[0];
        const value = vql.d[key];
        value.path = trimPath(value.path);
    }
    else if ("r" in vql) {
        const value = vql.r;
        value.path = trimPath(value.path);
        if (value.relations) {
            relationFix(value.relations);
        }
    }
}
function replaceVariables(obj, variables) {
    if (typeof obj === "string") {
        if (obj.startsWith("$")) {
            return variables[obj.slice(1)] || variables[obj];
        }
        return obj;
    }
    else if (Array.isArray(obj)) {
        return obj.map((item) => replaceVariables(item, variables));
    }
    else if (typeof obj === "object") {
        const newObj = {};
        for (const key in obj) {
            newObj[key] = replaceVariables(obj[key], variables);
        }
        return newObj;
    }
    else {
        return obj;
    }
}
export function executeSheet(query, preDefinedSheets) {
    if ("ref" in query) {
        if (preDefinedSheets.has(query.ref)) {
            const ref = preDefinedSheets.get(query.ref);
            const merge = deepMerge(query, ref);
            pathFix(merge);
            query = merge;
        }
        delete query.ref;
    }
    if ("var" in query) {
        query = replaceVariables(query, query.var);
        delete query.var;
    }
    return query;
}
//# sourceMappingURL=index.js.map