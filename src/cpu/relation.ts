import { RelationTypes } from "@wxn0brp/db";
import { VQLProcessor } from "../processor";
import { RelationQuery } from "../types/vql";
import { checkRelationPermission } from "../permissions";
import { parseSelect } from "./utils";
import { VQLConfig } from "../config";

function standardizeRelationRequest(req: RelationTypes.Relation | RelationQuery["r"]) {
    req.select = parseSelect(req.select || []);
}

export async function executeRelation(cpu: VQLProcessor, query: RelationQuery, user: any): Promise<any> {
    if (!VQLConfig.noCheckPermissions && !await checkRelationPermission(cpu.gw, user, query)) {
        throw new Error("Permission denied");
    }

    const req = query.r;
    standardizeRelationRequest(req);

    const { path, search, relations, select } = req;

    if (req.many) {
        return await cpu.relation.find(path, search, relations, select, req.options);
    } else {
        return await cpu.relation.findOne(path, search, relations, select);
    }
}