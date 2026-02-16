import { VQLConfig } from "#helpers/config";
import { LowAdapter } from "#helpers/lowAdapter";
import { UpdateOneOrAdd } from "@wxn0brp/db-core/types/collection";
import { checkRequestPermission } from "../permissions";
import { VQLProcessor } from "../processor";
import {
    VQL_OP_Add,
    VQL_OP_CollectionOperation,
    VQL_OP_Find,
    VQL_OP_FindOne,
    VQL_OP_Remove,
    VQL_OP_ToggleOne,
    VQL_OP_Update,
    VQL_OP_UpdateOneOrAdd,
    VQL_Query_CRUD_Keys
} from "../types/vql";
import { VQL_Query_CRUD } from "./../types/vql";
import { parseSelect } from "./utils";

export async function executeQuery(cpu: VQLProcessor, query: VQL_Query_CRUD, user: any, cfg: VQLConfig): Promise<any> {
    if (!query.db || !cpu.dbInstances[query.db])
        return { err: true, msg: `Invalid query - db "${query.db || "undefined"}" not found`, c: 400 };

    const db = cpu.dbInstances[query.db];

    if (db instanceof LowAdapter) return await db.resolver(query, user);

    const operation = Object.keys(query.d)[0] as VQL_Query_CRUD_Keys;

    if (!cfg.noCheckPermissions && !await checkRequestPermission(cfg, cpu.permValidFn, user, query)) {
        return { err: true, msg: "Permission denied", c: 403 };
    }

    if (operation === "removeCollection") {
        const params = query.d[operation] as VQL_OP_CollectionOperation;
        return db.removeCollection(params.collection);

    } else if (operation === "ensureCollection") {
        const params = query.d[operation] as VQL_OP_CollectionOperation;
        return db.ensureCollection(params.collection);

    } else if (operation === "issetCollection") {
        const params = query.d[operation] as VQL_OP_CollectionOperation;
        return db.issetCollection(params.collection);

    } else if (operation === "getCollections") {
        return db.getCollections();
    }

    const collection = db.c(query.d[operation].collection);

    if (operation === "find") {
        const params = query.d[operation] as VQL_OP_Find;
        const select = parseSelect(cfg, params.fields || params.select || {});
        if (select && typeof select === "object" && Object.keys(select).length !== 0) params.searchOpts = { ...params.searchOpts, select };

        return collection.find(params.search, params.options || {}, params.searchOpts);
    } else if (operation === "findOne" || operation === "f") {
        const params = query.d[operation] as VQL_OP_FindOne;
        const select = parseSelect(cfg, params.fields || params.select || {});
        if (select && typeof select === "object" && Object.keys(select).length !== 0) params.searchOpts = { ...params.searchOpts, select };

        return collection.findOne(params.search, params.searchOpts);
    } else if (operation === "add") {
        const params = query.d[operation] as VQL_OP_Add;
        return collection.add(params.data, (params.id_gen ?? true) as false);

    } else if (operation === "update") {
        const params = query.d[operation] as VQL_OP_Update;
        return collection.update(params.search, params.updater);

    } else if (operation === "updateOne") {
        const params = query.d[operation] as VQL_OP_Update;
        return collection.updateOne(params.search, params.updater);

    } else if (operation === "remove") {
        const params = query.d[operation] as VQL_OP_Remove;
        return collection.remove(params.search);

    } else if (operation === "removeOne") {
        const params = query.d[operation] as VQL_OP_Remove;
        return collection.removeOne(params.search);

    } else if (operation === "updateOneOrAdd") {
        const params = query.d[operation] as VQL_OP_UpdateOneOrAdd;
        const opts: UpdateOneOrAdd<any> = {};
        if (params.add_arg) opts.add_arg = params.add_arg;
        if (params.id_gen) opts.id_gen = params.id_gen;
        return collection.updateOneOrAdd(params.search, params.updater, opts);

    } else if (operation === "toggleOne") {
        const params = query.d[operation] as VQL_OP_ToggleOne;
        return collection.toggleOne(params.search, params.data);

    } else {
        const n: never = operation;
        throw new Error("Unknown operation " + n);
    }
}
