import { RelationTypes } from "@wxn0brp/db-core";
import { VQLConfig } from "../helpers/config";
import { checkRelationPermission } from "../permissions";
import { VQLProcessor } from "../processor";
import { VQL_Query_Relation } from "../types/vql";
import { parseSelect } from "./utils";
import { VQLDBNotFoundError, VQLPermissionDeniedError } from "../errors";

function standardizeRelationRequest(
	config: VQLConfig,
	req: RelationTypes.Relation | VQL_Query_Relation["r"],
) {
	req.select = parseSelect(config, req.select);
}

function checkDBsExist(
	cpu: VQLProcessor,
	req: RelationTypes.Relation | VQL_Query_Relation["r"],
) {
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

export async function executeRelation(
	cpu: VQLProcessor,
	query: VQL_Query_Relation,
	user: any,
	cfg: VQLConfig,
): Promise<any> {
	checkDBsExist(cpu, query.r);

	if (
		!cfg.noCheckPermissions &&
		!(await checkRelationPermission(cfg, cpu.permValidFn, user, query))
	) {
		throw new VQLPermissionDeniedError("relation not permitted");
	}

	const req = query.r;
	standardizeRelationRequest(cfg, req);

	const { path, search, relations, select } = req;

	if (req.many) {
		return await cpu.relation.find(
			path,
			search,
			relations,
			select,
			req.options,
		);
	} else {
		return await cpu.relation.findOne(path, search, relations, select);
	}
}
