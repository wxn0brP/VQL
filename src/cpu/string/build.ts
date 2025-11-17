import { VQL_Query } from "#types/vql";
import { RelationTypes } from "@wxn0brp/db-core";
import { convertSearchObjToSearchArray } from "./utils";

export function buildVQL(db: string, op: string, collection: string, query: Record<string, any>): VQL_Query {
    return "relations" in query ?
        buildRelation(db, collection, query) :
        buildQuery(db, op, collection, query);
}

function buildRelation(db: string, collection: string, query: Record<string, any>) {
    const relations: RelationTypes.Relation = {};
    for (const key in query.relations) {
        const value = query.relations[key];
        relations[key] = {
            path: [value.db as any || db as string, value.c || key],
            ...value
        };
        delete (relations[key] as any).db;
        delete (relations[key] as any).c;
    }

    if ("select" in query)
        query.select = convertSearchObjToSearchArray(query.select);

    return {
        r: {
            path: [db, collection],
            ...query,
            relations,
        }
    } as any;
}

function buildQuery(db: string, op: string, collection: string, query: Record<string, any>) {
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
    } as any;
}