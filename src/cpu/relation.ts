import { RelationTypes } from "@wxn0brp/db";
import { VQLProcessor } from "../processor";
import { RelationQuery } from "../types/vql";
import { checkRelationPermission } from "../permissions";

function standardizeRelationRequest(req: RelationTypes.Relation | RelationQuery["r"]) {
    if (!req.select) req.select = [];
}

export async function executeRelation(cpu: VQLProcessor, query: RelationQuery, user: any): Promise<any> {
    if (!await checkRelationPermission(cpu.gw, user, query)) {
        throw new Error("Permission denied");
    }

    const req = query.r;
    standardizeRelationRequest(req);

    if (req.many) {
        return await cpu.relation.find(req.path, req.search, req.relations, req.select, req.options);
    } else {
        return await cpu.relation.findOne(req.path, req.search, req.relations, req.select);
    }
}