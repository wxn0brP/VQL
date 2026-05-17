import { LowAdapter } from "../helpers/lowAdapter.js";
import { checkRequestPermission } from "../permissions/index.js";
import { parseSelect } from "./utils.js";
export async function executeQuery(cpu, query, user, cfg) {
    if (!query.db || !cpu.dbInstances[query.db])
        return { err: true, msg: `Invalid query - db "${query.db || "undefined"}" not found`, c: 400 };
    const db = cpu.dbInstances[query.db];
    if (db instanceof LowAdapter)
        return await db.resolver(query, user);
    const operation = Object.keys(query.d)[0];
    if (!cfg.noCheckPermissions && !await checkRequestPermission(cfg, cpu.permValidFn, user, query)) {
        return { err: true, msg: "Permission denied", c: 403 };
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
    const collection = db.c(query.d[operation].collection);
    if (operation === "find") {
        const params = query.d[operation];
        const select = parseSelect(cfg, params.select || {});
        if (select && typeof select === "object" && Object.keys(select).length !== 0)
            params.searchOpts = { ...params.searchOpts, select };
        return collection.find(params.search, params.options || {}, params.searchOpts);
    }
    else if (operation === "findOne" || operation === "f") {
        const params = query.d[operation];
        const select = parseSelect(cfg, params.select || {});
        if (select && typeof select === "object" && Object.keys(select).length !== 0)
            params.searchOpts = { ...params.searchOpts, select };
        return collection.findOne(params.search, params.searchOpts);
    }
    else if (operation === "add") {
        const params = query.d[operation];
        return collection.add(params.data, (params.id_gen ?? true));
    }
    else if (operation === "update") {
        const params = query.d[operation];
        return collection.update(params.search, params.updater);
    }
    else if (operation === "updateOne") {
        const params = query.d[operation];
        return collection.updateOne(params.search, params.updater);
    }
    else if (operation === "remove") {
        const params = query.d[operation];
        return collection.remove(params.search);
    }
    else if (operation === "removeOne") {
        const params = query.d[operation];
        return collection.removeOne(params.search);
    }
    else if (operation === "updateOneOrAdd") {
        const params = query.d[operation];
        const opts = {};
        if (params.add_arg)
            opts.add_arg = params.add_arg;
        if (params.id_gen)
            opts.id_gen = params.id_gen;
        return collection.updateOneOrAdd(params.search, params.updater, opts);
    }
    else if (operation === "toggleOne") {
        const params = query.d[operation];
        return collection.toggleOne(params.search, params.data);
    }
    else {
        const n = operation;
        throw new Error("Unknown operation " + n);
    }
}
