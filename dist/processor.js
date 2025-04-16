import { Relation } from "@wxn0brp/db";
import { validateRaw, validateVql } from "./valid.js";
import { executeSheet } from "./sheet/index.js";
import { executeQuery } from "./cpu/request.js";
import { executeRelation } from "./cpu/relation.js";
import { parseStringQuery } from "./cpu/string.js";
export class VQLProcessor {
    dbInstances;
    gw;
    relation;
    preDefinedSheets = new Map();
    constructor(dbInstances, gw) {
        this.dbInstances = dbInstances;
        this.gw = gw;
        this.relation = new Relation(dbInstances);
    }
    async execute(queryRaw, user) {
        if (typeof queryRaw === "string") {
            queryRaw = parseStringQuery(queryRaw);
        }
        if (!validateRaw(queryRaw))
            return { err: true, msg: "Invalid query", c: 400 };
        const query = executeSheet(queryRaw, this.preDefinedSheets);
        if (!validateVql(query))
            return { err: true, msg: "Invalid query", c: 400 };
        if ("r" in query) {
            return await executeRelation(this, query, user);
        }
        else if ("d" in query) {
            return await executeQuery(this, query, user);
        }
        else {
            return { err: true, msg: "Invalid query", c: 400 };
        }
    }
}
//# sourceMappingURL=processor.js.map