import { checkRelationPermission } from "../permissions/index.js";
import { parseSelect } from "./utils.js";
import { VQLDBNotFoundError, VQLPermissionDeniedError } from "../errors.js";
function standardizeRelationRequest(config, req) {
    req.select = parseSelect(config, req.select);
}
function checkDBsExist(cpu, req) {
    const db = req.path[0];
    if (!db || !cpu.dbInstances[db]) {
        throw new VQLDBNotFoundError(String(db));
    }
    if (req.relations) {
        for (const relation of Object.values(req.relations)) {
            checkDBsExist(cpu, relation);
        }
    }
}
export async function executeRelation(cpu, query, user, cfg) {
    checkDBsExist(cpu, query.r);
    if (!cfg.noCheckPermissions &&
        !(await checkRelationPermission(cfg, cpu.permValidFn, user, query))) {
        throw new VQLPermissionDeniedError("relation not permitted");
    }
    const req = query.r;
    standardizeRelationRequest(cfg, req);
    const { path, search, relations, select } = req;
    if (req.many) {
        return await cpu.relation.find(path, search, relations, select, req.options);
    }
    else {
        return await cpu.relation.findOne(path, search, relations, select);
    }
}
