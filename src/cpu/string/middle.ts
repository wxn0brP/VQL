import { VQL } from "../../types/vql";

export function processVQL_MB(db: string, op: string, collection: string, parsed: Record<string, any>): VQL {
    return "relations" in parsed ?
        processRelation_MB(db, collection, parsed) :
        processQuery_MB(db, op, collection, parsed);
}


export function convertSearchObjToSearchArray(obj: Record<string, any>, parentKeys: string[] = []): string[][] {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        const currentPath = [...parentKeys, key];

        if (!value) {
            return acc;
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            return [...acc, ...convertSearchObjToSearchArray(value, currentPath)];
        } else {
            return [...acc, currentPath];
        }
    }, []);
}

function processRelation_MB(db: string, collection: string, parsed: Record<string, any>): VQL {
    if ("select" in parsed && typeof parsed.select === "object" && !Array.isArray(parsed.select)) {
        parsed.select = convertSearchObjToSearchArray(parsed.select);
    }
    return {
        r: {
            path: [parsed.db || db, parsed.c || collection],
            ...parsed
        }
    } as any;
}

function processQuery_MB(db: string, op: string, collection: string, parsed: Record<string, any>): VQL {
    return {
        db,
        d: {
            [op]: {
                collection,
                ...parsed
            }
        }
    } as any;
}