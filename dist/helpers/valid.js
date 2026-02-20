function emptyErr(msg = "Bad query") {
    return {
        err: true,
        msg,
        c: 400
    };
}
function isObj(obj, one = true) {
    return typeof obj === "object" && obj !== null && !Array.isArray(obj) && (!one || Object.keys(obj).length !== 0);
}
export function validateRaw(query) {
    if (("r" in query && isObj(query.r)) ||
        ("db" in query && typeof query.db === "string" && isObj(query.d)))
        return true;
    return emptyErr("Invalid VQL query structure. Must contain 'r' or 'db' and 'd'.");
}
function validateRelations(relations) {
    if (!isObj(relations, false))
        return emptyErr("The 'relations' property must be an object.");
    for (const key in relations) {
        const relation = relations[key];
        if (!isObj(relation))
            return emptyErr(`Relation '${key}' must be an object.`);
        if (!("path" in relation) || !Array.isArray(relation.path) || relation.path.length !== 2)
            return emptyErr(`Relation '${key}' must have a 'path' property with an array of two strings.`);
        if ("search" in relation && !isObj(relation.search, false))
            return emptyErr(`Relation '${key}' has an invalid 'search' property; it must be an object.`);
        if ("many" in relation && typeof relation.many !== "boolean")
            return emptyErr(`Relation '${key}' has an invalid 'many' property; it must be a boolean.`);
        if ("options" in relation && !isObj(relation.options, false))
            return emptyErr(`Relation '${key}' has an invalid 'options' property; it must be an object.`);
        if ("select" in relation && !Array.isArray(relation.select))
            return emptyErr(`Relation '${key}' has an invalid 'select' property; it must be an array.`);
        if ("relations" in relation) {
            const nestedResult = validateRelations(relation.relations);
            if (nestedResult !== true)
                return nestedResult;
        }
    }
    return true;
}
function validR(query) {
    const { r } = query;
    if (!("path" in r) || !Array.isArray(r.path) || r.path.length !== 2)
        return emptyErr("Relation query 'r' must have a 'path' property with an array of two strings.");
    if (!isObj(r.search, false))
        return emptyErr("Relation query 'r.search' must be an object.");
    if (!isObj(r.relations, false))
        return emptyErr("Relation query 'r' must have a 'relations' object.");
    const relationsValidation = validateRelations(r.relations);
    if (relationsValidation !== true)
        return relationsValidation;
    if ("many" in r && typeof r.many !== "boolean")
        return emptyErr("Relation query 'r.many' must be a boolean.");
    if ("options" in r && !isObj(r.options, false))
        return emptyErr("Relation query 'r.options' must be an object.");
    if ("select" in r && typeof r.select !== "object")
        return emptyErr("Relation query 'r.select' must be an object or an array.");
    return true;
}
function validD(query) {
    const { d } = query;
    const key = Object.keys(d)[0];
    const value = d[key]; // Cast for common property
    if (key === "getCollections")
        return true;
    if (typeof value.collection !== "string" || value.collection.trim() === "")
        return emptyErr(`CRUD operation '${key}' must specify a non-empty 'collection' string.`);
    if (key === "issetCollection" || key === "ensureCollection" || key === "removeCollection") {
        return true;
    }
    if (key === "add") {
        const op = d.add;
        if (!isObj(op.data))
            return emptyErr("'add' operation requires a 'data' object.");
        if ("id_gen" in op && typeof op.id_gen !== "boolean")
            return emptyErr("'add' operation 'id_gen' property must be a boolean.");
        return true;
    }
    if (key === "find") {
        const op = d.find;
        if ("search" in op && !isObj(op.search, false))
            return emptyErr("'find' operation 'search' property must be an object.");
        if ("limit" in op && typeof op.limit !== "number")
            return emptyErr("'find' operation 'limit' property must be a number.");
        if ("fields" in op && !isObj(op.fields, false) && !Array.isArray(op.fields))
            return emptyErr("'find' operation 'fields' property must be an object or an array.");
        if ("select" in op && !isObj(op.select, false) && !Array.isArray(op.select))
            return emptyErr("'find' operation 'select' property must be an object or an array.");
        if ("options" in op && !isObj(op.options, false))
            return emptyErr("'find' operation 'options' property must be an object.");
        if ("searchOpts" in op && !isObj(op.searchOpts, false))
            return emptyErr("'find' operation 'searchOpts' property must be an object.");
        return true;
    }
    if (key === "findOne" || key === "f") {
        const op = d.findOne || d.f;
        if (!isObj(op.search, false))
            return emptyErr(`'${key}' operation requires a 'search' object.`);
        if ("fields" in op && !isObj(op.fields, false) && !Array.isArray(op.fields))
            return emptyErr(`'${key}' operation 'fields' property must be an object or an array.`);
        if ("select" in op && !isObj(op.select, false) && !Array.isArray(op.select))
            return emptyErr(`'${key}' operation 'select' property must be an object or an array.`);
        if ("searchOpts" in op && !isObj(op.searchOpts, false))
            return emptyErr(`'${key}' operation 'searchOpts' property must be an object.`);
        return true;
    }
    if (key === "remove" || key === "removeOne") {
        const op = d.remove || d.removeOne;
        if (!isObj(op.search, false))
            return emptyErr(`'${key}' operation requires a 'search' object.`);
        return true;
    }
    if (key === "update" || key === "updateOne") {
        const op = d.update || d.updateOne;
        if (!isObj(op.search, false))
            return emptyErr(`'${key}' operation requires a 'search' object.`);
        if (!isObj(op.updater, false))
            return emptyErr(`'${key}' operation requires an 'updater' object.`);
        return true;
    }
    if (key === "updateOneOrAdd") {
        const op = d.updateOneOrAdd;
        if (!isObj(op.search, false))
            return emptyErr("'updateOneOrAdd' operation requires a 'search' object.");
        if (!isObj(op.updater, false))
            return emptyErr("'updateOneOrAdd' operation requires an 'updater' object.");
        if ("add_arg" in op && !isObj(op.add_arg, false))
            return emptyErr("'updateOneOrAdd' operation 'add_arg' property must be an object.");
        if ("id_gen" in op && typeof op.id_gen !== "boolean")
            return emptyErr("'updateOneOrAdd' operation 'id_gen' property must be a boolean.");
        return true;
    }
    if (key === "toggleOne") {
        const op = d.toggleOne;
        if (!isObj(op.search, false))
            return emptyErr("'toggleOne' operation requires a 'search' object.");
        if ("data" in op && !isObj(op.data, false))
            return emptyErr("'toggleOne' operation 'data' property must be an object.");
        return true;
    }
    const n = key;
    return emptyErr(`Unknown or invalid CRUD operation: '${key}'`);
}
export function validateVql(query) {
    if ("r" in query && isObj(query.r))
        return validR(query);
    if ("d" in query && isObj(query.d))
        return validD(query);
    return emptyErr("Query must contain a valid 'r' (relation) or 'd' (database) property.");
}
