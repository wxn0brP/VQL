import { Relation, Valthera } from "@wxn0brp/db";
import { GateWarden } from "@wxn0brp/gate-warden";
import { VQL, VQLR } from "./types/vql";
import { validateRaw, validateVql } from "./valid";
import { executeSheet } from "./sheet";
import { executeQuery } from "./cpu/request";
import { executeRelation } from "./cpu/relation";
import { parseStringQuery } from "./cpu/string";

export class VQLProcessor<GW=any> {
    public relation: Relation;
    public preDefinedSheets: Map<string, VQL> = new Map();

    constructor(
        public dbInstances: Record<string, Valthera>,
        public gw: GateWarden<GW>
    ) {
        this.relation = new Relation(dbInstances);
    }

    async execute(queryRaw: VQLR | string, user: any): Promise<any> {
        if (typeof queryRaw === "string") {
            queryRaw = parseStringQuery(queryRaw);
        }

        const validateRawResult = validateRaw(queryRaw);
        if (validateRawResult !== true) return validateRawResult;

        const query = executeSheet(queryRaw, this.preDefinedSheets);

        const validateVqlResult = validateVql(query);
        if (validateVqlResult !== true) return validateVqlResult;

        if ("r" in query) {
            return await executeRelation(this, query, user);
        } else if ("d" in query) {
            return await executeQuery(this, query, user);
        } else {
            return { err: true, msg: "Invalid query", c: 400 };
        }
    }
}
