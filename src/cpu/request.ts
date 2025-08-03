import { checkRequestPermission } from "../permissions";
import { VQLProcessor } from "../processor";
import {
    VQLAdd,
    VQLCollectionOperation,
    VQLFind,
    VQLFindOne,
    VQLQuery,
    VQLRemove,
    VQLRequest,
    VQLUpdate,
    VQLUpdateOneOrAdd
} from "../types/vql";
import { parseSelect } from "./utils";

export async function executeQuery(cpu: VQLProcessor, query: VQLRequest, user: any): Promise<any> {
    if (!query.db || !cpu.dbInstances[query.db])
        return { err: true, msg: `Invalid query - db "${query.db || "undefined"}" not found`, c: 400 };

    const db = cpu.dbInstances[query.db];

    const operation = Object.keys(query.d)[0] as keyof VQLQuery;

    if (!cpu.config.noCheckPermissions && !await checkRequestPermission(cpu.config, cpu.validFn, user, query)) {
        return { err: true, msg: "Permission denied", c: 403 };
    }

    if (operation === "find") {
        const params = query.d[operation] as VQLFind;
        const select = parseSelect(cpu.config, params.fields || params.select || {});
        if (select && typeof select === "object" && Object.keys(select).length !== 0) params.searchOpts = { ...params.searchOpts, select };

        return db.find(params.collection, params.search, {}, params.options || {}, params.searchOpts);
    } else if (operation === "findOne" || operation === "f") {
        const params = query.d[operation] as VQLFindOne;
        const select = parseSelect(cpu.config, params.fields || params.select || {});
        if (select && typeof select === "object" && Object.keys(select).length !== 0) params.searchOpts = { ...params.searchOpts, select };

        return db.findOne(params.collection, params.search, {}, params.searchOpts);
    } else if (operation === "add") {
        const params = query.d[operation] as VQLAdd;
        return db.add(params.collection, params.data, params.id_gen ?? true);
    } else if (operation === "update") {
        const params = query.d[operation] as VQLUpdate;
        return db.update(params.collection, params.search, params.updater);
    } else if (operation === "updateOne") {
        const params = query.d[operation] as VQLUpdate;
        return db.updateOne(params.collection, params.search, params.updater);
    } else if (operation === "remove") {
        const params = query.d[operation] as VQLRemove;
        return db.remove(params.collection, params.search);
    } else if (operation === "removeOne") {
        const params = query.d[operation] as VQLRemove;
        return db.removeOne(params.collection, params.search);
    } else if (operation === "updateOneOrAdd") {
        const params = query.d[operation] as VQLUpdateOneOrAdd;
        return db.updateOneOrAdd(params.collection, params.search, params.updater, params.add_arg || {}, {}, params.id_gen ?? true);
    } else if (operation === "removeCollection") {
        const params = query.d[operation] as VQLCollectionOperation;
        return db.removeCollection(params.collection);
    } else if (operation === "ensureCollection") {
        const params = query.d[operation] as VQLCollectionOperation;
        return db.ensureCollection(params.collection);
    } else if (operation === "issetCollection") {
        const params = query.d[operation] as VQLCollectionOperation;
        return db.issetCollection(params.collection);
    } else if (operation === "getCollections") {
        return db.getCollections();
    } else {
        const n: never = operation;
        throw new Error("Unknown operation " + n);
    }
}