export function processVQL_MB(db, op, collection, parsed) {
    return "relations" in parsed ?
        processRelation_MB(db, collection, parsed) :
        processQuery_MB(db, op, collection, parsed);
}
export function convertSearchObjToSearchArray(obj, parentKeys = []) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        const currentPath = [...parentKeys, key];
        if (!value) {
            return acc;
        }
        else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            return [...acc, ...convertSearchObjToSearchArray(value, currentPath)];
        }
        else {
            return [...acc, currentPath];
        }
    }, []);
}
function processRelation_MB(db, collection, parsed) {
    if ("select" in parsed && typeof parsed.select === "object" && !Array.isArray(parsed.select)) {
        parsed.select = convertSearchObjToSearchArray(parsed.select);
    }
    return {
        r: {
            path: [parsed.db || db, parsed.c || collection],
            ...parsed
        }
    };
}
function processQuery_MB(db, op, collection, parsed) {
    return {
        db,
        d: {
            [op]: {
                collection,
                ...parsed
            }
        }
    };
}
//# sourceMappingURL=middle.js.map