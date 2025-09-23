import { UpdateOneOrAdd } from "@wxn0brp/db-core/types/valthera";
import { checkRequestPermission } from "../permissions";
import { VQLProcessor } from "../processor";
import {
    VQL_OP_Add,
    VQL_OP_CollectionOperation,
    VQL_OP_Find,
    VQL_OP_FindOne,
    VQL_OP_Remove,
    VQL_OP_Update,
    VQL_OP_UpdateOneOrAdd,
    VQL_Query_CRUD,
    VQL_Query_CRUD_Data
} from "../types/vql";
import { parseSelect } from "./utils";

export async function executeQuery(cpu: VQLProcessor, query: VQL_Query_CRUD, user: any): Promise<any> {
    if (!query.db || !cpu.dbInstances[query.db])
        return { err: true, msg: `Invalid query - db "${query.db || "undefined"}" not found`, c: 400 };

    const db = cpu.dbInstances[query.db];

    const operation = Object.keys(query.d)[0] as keyof VQL_Query_CRUD_Data;

    if (!cpu.config.noCheckPermissions && !await checkRequestPermission(cpu.config, cpu.permValidFn, user, query)) {
        return { err: true, msg: "Permission denied", c: 403 };
    }

    const context = { user };

    if (operation === "find") {
        const params = query.d[operation] as VQL_OP_Find;
        const select = parseSelect(cpu.config, params.fields || params.select || {});
        if (select && typeof select === "object" && Object.keys(select).length !== 0) params.searchOpts = { ...params.searchOpts, select };

        return db.find(params.collection, params.search, context, params.options || {}, params.searchOpts);
    } else if (operation === "findOne" || operation === "f") {
        const params = query.d[operation] as VQL_OP_FindOne;
        const select = parseSelect(cpu.config, params.fields || params.select || {});
        if (select && typeof select === "object" && Object.keys(select).length !== 0) params.searchOpts = { ...params.searchOpts, select };

        return db.findOne(params.collection, params.search, context, params.searchOpts);
    } else if (operation === "add") {
        const params = query.d[operation] as VQL_OP_Add;
        return db.add(params.collection, params.data, params.id_gen ?? true, context);
    } else if (operation === "update") {
        const params = query.d[operation] as VQL_OP_Update;
        return db.update(params.collection, params.search, params.updater, context);
    } else if (operation === "updateOne") {
        const params = query.d[operation] as VQL_OP_Update;
        return db.updateOne(params.collection, params.search, params.updater, context);
    } else if (operation === "remove") {
        const params = query.d[operation] as VQL_OP_Remove;
        return db.remove(params.collection, params.search, context);
    } else if (operation === "removeOne") {
        const params = query.d[operation] as VQL_OP_Remove;
        return db.removeOne(params.collection, params.search, context);
    } else if (operation === "updateOneOrAdd") {
        const params = query.d[operation] as VQL_OP_UpdateOneOrAdd;
        return db.updateOneOrAdd(params.collection, params.search, params.updater, params.add_arg, context, params.id_gen);
    } else if (operation === "removeCollection") {
        const params = query.d[operation] as VQL_OP_CollectionOperation;
        return db.removeCollection(params.collection, context);
    } else if (operation === "ensureCollection") {
        const params = query.d[operation] as VQL_OP_CollectionOperation;
        return db.ensureCollection(params.collection, context);
    } else if (operation === "issetCollection") {
        const params = query.d[operation] as VQL_OP_CollectionOperation;
        return db.issetCollection(params.collection, context);
    } else if (operation === "getCollections") {
        return db.getCollections(context);
    } else {
        const n: never = operation;
        throw new Error("Unknown operation " + n);
    }
}