import { LowAdapter } from "../helpers/lowAdapter.js";
import { updateFindObject } from "@wxn0brp/db-core/utils/updateFindObject";
import { checkRequestPermission, filterObjectByPermissions, filterObjectsByPermissions, } from "../permissions/index.js";
import { parseSelect } from "./utils.js";
function applySelect(obj, select) {
    if (!select || select.length === 0)
        return obj;
    return updateFindObject(obj, {
        select,
    });
}
function applySelectToArray(arr, select) {
    if (!select || select.length === 0)
        return arr;
    return arr.map(obj => applySelect(obj, select));
}
export async function executeQuery(cpu, query, user, cfg) {
    if (!query.db || !cpu.dbInstances[query.db])
        return {
            err: true,
            msg: `Invalid query - db "${query.db || "undefined"}" not found`,
            c: 400,
        };
    const db = cpu.dbInstances[query.db];
    if (db instanceof LowAdapter)
        return await db.resolver(query, user);
    const operation = Object.keys(query.d)[0];
    if (!cfg.noCheckPermissions &&
        !(await checkRequestPermission(cfg, cpu.permValidFn, user, query))) {
        return {
            err: true,
            msg: "Permission denied",
            c: 403,
        };
    }
    if (operation === "removeCollection") {
        const params = query.d[operation];
        return db.removeCollection(params.collection);
    }
    else if (operation === "ensureCollection") {
        const params = query.d[operation];
        return db.ensureCollection(params.collection);
    }
    else if (operation === "issetCollection") {
        const params = query.d[operation];
        return db.issetCollection(params.collection);
    }
    else if (operation === "getCollections") {
        return db.getCollections();
    }
    const collectionName = query.d[operation].collection;
    const collection = db.c(collectionName);
    if (operation === "find") {
        const params = query.d[operation];
        const select = parseSelect(cfg, params.select || {});
        if (select &&
            typeof select === "object" &&
            Object.keys(select).length !== 0)
            params.searchOpts = {
                ...params.searchOpts,
                select,
            };
        const result = await collection.find(params.search, params.options || {}, params.searchOpts);
        if (!cfg.noCheckPermissions) {
            return filterObjectsByPermissions(cfg, cpu.permValidFn, user, query.db, collectionName, result);
        }
        return result;
    }
    else if (operation === "findOne" || operation === "f") {
        const params = query.d[operation];
        const select = parseSelect(cfg, params.select || {});
        if (select &&
            typeof select === "object" &&
            Object.keys(select).length !== 0)
            params.searchOpts = {
                ...params.searchOpts,
                select,
            };
        const result = await collection.findOne(params.search, params.searchOpts);
        if (!cfg.noCheckPermissions && result) {
            return filterObjectByPermissions(cfg, cpu.permValidFn, user, query.db, collectionName, result);
        }
        return result;
    }
    else if (operation === "add") {
        const params = query.d[operation];
        const result = await collection.add(params.data, (params.id_gen ?? true));
        if (!cfg.noCheckPermissions) {
            return filterObjectByPermissions(cfg, cpu.permValidFn, user, query.db, collectionName, result);
        }
        return result;
    }
    else if (operation === "update") {
        const params = query.d[operation];
        const select = parseSelect(cfg, params.select || {});
        const result = await collection.update(params.search, params.updater);
        if (!cfg.noCheckPermissions) {
            const filtered = await filterObjectsByPermissions(cfg, cpu.permValidFn, user, query.db, collectionName, result);
            return applySelectToArray(filtered, select);
        }
        return applySelectToArray(result, select);
    }
    else if (operation === "updateOne") {
        const params = query.d[operation];
        const select = parseSelect(cfg, params.select || {});
        const result = await collection.updateOne(params.search, params.updater);
        if (!cfg.noCheckPermissions && result) {
            const filtered = await filterObjectByPermissions(cfg, cpu.permValidFn, user, query.db, collectionName, result);
            return applySelect(filtered, select);
        }
        return result ? applySelect(result, select) : result;
    }
    else if (operation === "remove") {
        const params = query.d[operation];
        const select = parseSelect(cfg, params.select || {});
        const result = await collection.remove(params.search);
        if (!cfg.noCheckPermissions) {
            const filtered = await filterObjectsByPermissions(cfg, cpu.permValidFn, user, query.db, collectionName, result);
            return applySelectToArray(filtered, select);
        }
        return applySelectToArray(result, select);
    }
    else if (operation === "removeOne") {
        const params = query.d[operation];
        const select = parseSelect(cfg, params.select || {});
        const result = await collection.removeOne(params.search);
        if (!cfg.noCheckPermissions && result) {
            const filtered = await filterObjectByPermissions(cfg, cpu.permValidFn, user, query.db, collectionName, result);
            return applySelect(filtered, select);
        }
        return result ? applySelect(result, select) : result;
    }
    else if (operation === "updateOneOrAdd") {
        const params = query.d[operation];
        const select = parseSelect(cfg, params.select || {});
        const opts = {};
        if (params.add_arg)
            opts.add_arg = params.add_arg;
        if (params.id_gen)
            opts.id_gen = params.id_gen;
        const result = await collection.updateOneOrAdd(params.search, params.updater, opts);
        if (result?.data) {
            let data = result.data;
            if (!cfg.noCheckPermissions) {
                data = await filterObjectByPermissions(cfg, cpu.permValidFn, user, query.db, collectionName, data);
            }
            return {
                ...result,
                data: applySelect(data, select),
            };
        }
        return result;
    }
    else if (operation === "toggleOne") {
        const params = query.d[operation];
        const select = parseSelect(cfg, params.select || {});
        const result = await collection.toggleOne(params.search, params.data);
        if (result?.data) {
            let data = result.data;
            if (!cfg.noCheckPermissions) {
                data = await filterObjectByPermissions(cfg, cpu.permValidFn, user, query.db, collectionName, data);
            }
            return {
                ...result,
                data: applySelect(data, select),
            };
        }
        return result;
    }
    else {
        const n = operation;
        throw new Error("Unknown operation " + n);
    }
}
