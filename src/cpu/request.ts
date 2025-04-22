import { checkRequestPermission } from "../permissions";
import { VQLProcessor } from "../processor";
import { VQLQuery, VQLRequest } from "../types/vql";
import { parseSelect } from "./utils";

export async function executeQuery(cpu: VQLProcessor, query: VQLRequest, user: any): Promise<any> {
    if (!query.db || !cpu.dbInstances[query.db]) throw new Error("Invalid DB");
    const db = cpu.dbInstances[query.db];

    const operation = Object.keys(query.d)[0] as keyof VQLQuery;

    if (!await checkRequestPermission(cpu.gw, user, query)) {
        throw new Error("Permission denied");
    }

    if (operation === "find") {
        const params = query.d[operation];
        const select = parseSelect(params.fields || params.select || {});
        return db.find(params.collection, params.search, {}, {}, { select });
    } else if (operation === "findOne" || operation === "f") {
        const params = query.d[operation];
        const select = parseSelect(params.fields || params.select || {});
        return db.findOne(params.collection, params.search, {}, { select });
    } else if (operation === "add") {
        const params = query.d[operation];
        return db.add(params.collection, params.data);
    } else if (operation === "update") {
        const params = query.d[operation];
        return db.update(params.collection, params.search, params.updater);
    } else if (operation === "updateOne") {
        const params = query.d[operation];
        return db.updateOne(params.collection, params.search, params.updater);
    } else if (operation === "remove") {
        const params = query.d[operation];
        return db.remove(params.collection, params.search);
    } else if (operation === "removeOne") {
        const params = query.d[operation];
        return db.removeOne(params.collection, params.search);
    } else if (operation === "updateOneOrAdd") {
        const params = query.d[operation];
        return db.updateOneOrAdd(params.collection, params.search, params.updater, params.add_arg || {}, {}, params.id_gen ?? true);
    } else {
        const n: never = operation;
        throw new Error("Unknown operation " + n);
    }
}