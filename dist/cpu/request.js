import { checkRequestPermission } from "../permissions/index.js";
export async function executeQuery(cpu, query, user) {
    if (!query.db || !cpu.dbInstances[query.db])
        throw new Error("Invalid DB");
    const db = cpu.dbInstances[query.db];
    const operation = Object.keys(query.d)[0];
    if (!await checkRequestPermission(cpu.gw, user, query)) {
        throw new Error("Permission denied");
    }
    if (operation === "find") {
        const params = query.d[operation];
        const fields = params.fields || {};
        return db.find(params.collection, params.search, {}, {}, { select: Object.keys(fields).filter(k => !!fields[k]) });
    }
    else if (operation === "findOne" || operation === "f") {
        const params = query.d[operation];
        const fields = params.fields || {};
        return db.findOne(params.collection, params.search, {}, { select: Object.keys(fields).filter(k => !!fields[k]) });
    }
    else if (operation === "add") {
        const params = query.d[operation];
        return db.add(params.collection, params.data);
    }
    else if (operation === "update") {
        const params = query.d[operation];
        return db.update(params.collection, params.search, params.updater);
    }
    else if (operation === "updateOne") {
        const params = query.d[operation];
        return db.updateOne(params.collection, params.search, params.updater);
    }
    else if (operation === "remove") {
        const params = query.d[operation];
        return db.remove(params.collection, params.search);
    }
    else if (operation === "removeOne") {
        const params = query.d[operation];
        return db.removeOne(params.collection, params.search);
    }
    else if (operation === "updateOneOrAdd") {
        const params = query.d[operation];
        return db.updateOneOrAdd(params.collection, params.search, params.updater, params.add_arg || {}, {}, params.id_gen ?? true);
    }
    else {
        const n = operation;
        throw new Error("Unknown operation " + n);
    }
}
//# sourceMappingURL=request.js.map