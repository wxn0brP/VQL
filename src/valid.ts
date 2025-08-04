import { VQL_Query_Relation, VQL_Query, VQLError, VQL_Query_CRUD } from "./types/vql";

function emptyErr(msg: string = "Bad query"): VQLError {
    return {
        err: true,
        msg,
        c: 400
    }
}

function isObj(obj: any, one = true): boolean {
    return typeof obj === "object" && obj !== null && !Array.isArray(obj) && (!one || Object.keys(obj).length !== 0);
}

export function validateRaw(query: VQL_Query): true | VQLError {
    if (
        ("r" in query && isObj(query.r)) ||
        ("db" in query && typeof query.db === "string" && isObj(query.d)) ||
        ("ref" in query && isObj(query.ref))
    ) return true;

    return emptyErr("Invalid VQL query structure. Must contain 'r', 'ref', or 'db' and 'd'.");
}

function validR(query: VQL_Query_Relation): true | VQLError {
    const { r } = query;
    if (!("path" in r) || !Array.isArray(r.path) || r.path.length !== 2) return emptyErr("Relation query 'r' must have a 'path' property with an array of two strings.");
    if (!isObj(r.search, false)) return emptyErr("Relation query 'r.search' must be an object.");
    return true;
}

function validD(query: VQL_Query_CRUD): true | VQLError {
    const { d } = query;
    const key = Object.keys(d)[0];
    if (key === "getCollections") return true;

    const value = d[key];
    if (typeof value.collection !== "string" || value.collection.trim() === "") return emptyErr(`'${key}' operation must specify a non-empty 'collection' string.`);

    if (key === "issetCollection" || key === "ensureCollection" || key === "removeCollection") return true;

    if (key === "add") {
        if (!isObj(value.data)) return emptyErr("'add' operation requires a 'data' object.");
        else return true;
    }

    if ("search" in value && !isObj(value.search, false)) return emptyErr(`'${key}' operation 'search' property must be an object.`);

    if (key === "find" || key === "findOne" || key === "f" || key === "remove" || key === "removeOne") return true;

    if (key === "update" || key === "updateOne" || key === "updateOneOrAdd") {
        if (!isObj(value.updater, false)) return emptyErr(`'${key}' operation requires an 'updater' object.`);
        else return true;
    }

    return true;
}

export function validateVql(query: VQL_Query): true | VQLError {
    if ("r" in query && isObj(query.r)) return validR(query);
    if ("d" in query && isObj(query.d)) return validD(query);
    return emptyErr("Query must contain a valid 'r' (relation) or 'd' (database) property.");
}
