import { Relation } from "@wxn0brp/db";
import { validateRaw, validateVql } from "./valid.js";
import { executeSheet } from "./sheet/index.js";
import { executeQuery } from "./cpu/request.js";
import { executeRelation } from "./cpu/relation.js";
import { parseStringQuery } from "./cpu/string/index.js";
export class VQLProcessor {
    dbInstances;
    gw;
    relation;
    preDefinedSheets = new Map();
    constructor(dbInstances, gw = null) {
        this.dbInstances = dbInstances;
        this.gw = gw;
        this.relation = new Relation(dbInstances);
    }
    async execute(queryRaw, user) {
        if (typeof queryRaw === "string") {
            try {
                queryRaw = parseStringQuery(queryRaw);
            }
            catch (e) {
                return { err: true, msg: "Invalid query", c: 400, why: `String query parsing error: ${e.message}` };
            }
        }
        const validateRawResult = validateRaw(queryRaw);
        if (validateRawResult !== true)
            return validateRawResult;
        const query = executeSheet(queryRaw, this.preDefinedSheets);
        const validateVqlResult = validateVql(query);
        if (validateVqlResult !== true)
            return validateVqlResult;
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