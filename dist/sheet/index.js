import { deepMerge } from "@wxn0brp/wts-deep-merge";
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
export function executeSheet(query, preDefinedSheets) {
    if ("ref" in query) {
        if (preDefinedSheets.has(query.ref)) {
            const ref = preDefinedSheets.get(query.ref);
            delete query.ref;
            const merge = deepMerge(query, ref);
            pathFix(merge);
            return merge;
        }
        delete query.ref;
    }
    return query;
}
//# sourceMappingURL=index.js.map