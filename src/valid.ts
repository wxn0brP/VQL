import { RelationQuery, VQL, VQLError, VQLR, VQLRequest } from "./types/vql";

function emptyErr(): VQLError {
    return {
        err: true,
        msg: "Bad query",
        c: 400
    }
}

function isObj(obj: any, one = true): boolean {
    return typeof obj === "object" && obj !== null && !Array.isArray(obj) && (!one || Object.keys(obj).length !== 0);
}

export function validateRaw(query: VQLR): true | VQLError {
    if (
        ("r" in query && isObj(query.r)) ||
        ("db" in query && typeof query.db === "string" && isObj(query.d)) ||
        ("ref" in query && isObj(query.ref))
    ) return true;

    return emptyErr();
}

function validR(query: RelationQuery): true | VQLError {
    const { r } = query;
    if (!("path" in r) || !Array.isArray(r.path) || r.path.length !== 2) return emptyErr();
    if (!isObj(r.search, false)) return emptyErr();
    return true;
}

function validD(query: VQLRequest): true | VQLError {
    const { d } = query;
    const key = Object.keys(d)[0];
    if (key === "getCollection") return true;

    const value = d[key];
    if (typeof value.collection !== "string" || value.collection.trim() === "") return emptyErr();

    if (key === "issetCollection" || key === "ensureCollection" || key === "removeCollection") return true;

    if (key === "add") {
        if (!isObj(value.data)) return emptyErr();
        else return true;
    }

    if ("search" in value && !isObj(value.search, false)) return emptyErr();

    if (key === "find" || key === "findOne" || key === "f" || key === "remove" || key === "removeOne") return true;

    if (key === "update" || key === "updateOne" || key === "updateOneOrAdd") {
        if (!isObj(value.updater, false)) return emptyErr();
        else return true;
    }

    return true;
}

export function validateVql(query: VQL): true | VQLError {
    if ("r" in query && isObj(query.r)) return validR(query);
    if ("d" in query && isObj(query.d)) return validD(query);
    return emptyErr();
}