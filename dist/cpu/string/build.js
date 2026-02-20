import { convertSearchObjToSearchArray } from "./utils.js";
export function buildVQL(db, op, collection, query) {
    return "relations" in query ?
        buildRelation(db, collection, query) :
        buildQuery(db, op, collection, query);
}
function buildRelation(db, collection, query) {
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
    if ("select" in query)
        query.select = convertSearchObjToSearchArray(query.select);
    return {
        r: {
            path: [db, collection],
            ...query,
            relations,
        }
    };
}
function buildQuery(db, op, collection, query) {
    if (query.fields && !query.select) {
        query.select = query.fields;
        delete query.fields;
    }
    if ("select" in query)
        query.select = [...new Set(convertSearchObjToSearchArray(query.select).map(k => k[0]).flat())];
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
