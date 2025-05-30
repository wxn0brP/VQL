import { RelationTypes } from "@wxn0brp/db";
import { VQLProcessor } from "../processor";
import { RelationQuery } from "../types/vql";
import { checkRelationPermission } from "../permissions";
import { parseSelect } from "./utils";
import { VQLConfig } from "../config";

function standardizeRelationRequest(config: VQLConfig, req: RelationTypes.Relation | RelationQuery["r"]) {
    req.select = parseSelect(config, req.select || []);
}

function checkDBsExist(cpu: VQLProcessor, req: RelationTypes.Relation | RelationQuery["r"]) {
    const db = req.path[0];

    if (!db || !cpu.dbInstances[db]) {
        return { err: true, msg: `Invalid query - db "${db}" not found`, c: 400 };
    }

    if (req.relations) {
        for (const relation of Object.values(req.relations)) {
            const res = checkDBsExist(cpu, relation);
            if (res.err) return res;
        }
    }
    return { err: false };
}

export async function executeRelation(cpu: VQLProcessor, query: RelationQuery, user: any): Promise<any> {
    const checkDb = checkDBsExist(cpu, query.r);
    if (checkDb.err) return checkDb;

    if (!cpu.config.noCheckPermissions && !await checkRelationPermission(cpu.config, cpu.gw, user, query)) {
        return { err: true, msg: "Permission denied", c: 403 };
    }

    const req = query.r;
    standardizeRelationRequest(cpu.config, req);

    const { path, search, relations, select } = req;

    if (req.many) {
        return await cpu.relation.find(path, search, relations, select, req.options);
    } else {
        return await cpu.relation.findOne(path, search, relations, select);
    }
}