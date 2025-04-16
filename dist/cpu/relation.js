import { checkRelationPermission } from "../permissions/index.js";
function standardizeRelationRequest(req) {
    if (!req.select)
        req.select = [];
}
export async function executeRelation(cpu, query, user) {
    if (!await checkRelationPermission(cpu.gw, user, query)) {
        throw new Error("Permission denied");
    }
    const req = query.r;
    standardizeRelationRequest(req);
    if (req.many) {
        return await cpu.relation.find(req.path, req.search, req.relations, req.select, req.options);
    }
    else {
        return await cpu.relation.findOne(req.path, req.search, req.relations, req.select);
    }
}
//# sourceMappingURL=relation.js.map