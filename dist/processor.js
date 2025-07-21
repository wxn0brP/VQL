import { Relation } from "@wxn0brp/db-core";
import { VQLConfig } from "./config.js";
import { executeRelation } from "./cpu/relation.js";
import { executeQuery } from "./cpu/request.js";
import { parseStringQuery } from "./cpu/string/index.js";
import logger from "./logger.js";
import { executeSheetAndReplaceVars } from "./sheet/index.js";
import { validateRaw, validateVql } from "./valid.js";
export class VQLProcessor {
    dbInstances;
    gw;
    config;
    relation;
    preDefinedSheets = new Map();
    constructor(dbInstances, gw = null, config = new VQLConfig()) {
        this.dbInstances = dbInstances;
        this.gw = gw;
        this.config = config;
        this.relation = new Relation(dbInstances);
    }
    async execute(queryRaw, user) {
        if (typeof queryRaw === "string" || "query" in queryRaw) {
            logger.info("Incoming string query");
            const q = typeof queryRaw === "string" ? queryRaw : queryRaw.query;
            const vars = typeof queryRaw === "string" ? null : queryRaw.var;
            const ref = typeof queryRaw === "string" ? null : queryRaw.ref;
            logger.debug(q);
            try {
                queryRaw = parseStringQuery(q);
                logger.debug("transformed query: ", queryRaw);
            }
            catch (e) {
                logger.error("Error parsing string query: ", { error: e, msg: e.message });
                return { err: true, msg: "Invalid query", c: 400, why: `String query parsing error: ${e.message}` };
            }
            if (vars)
                queryRaw = { ...queryRaw, var: vars };
            if (ref)
                queryRaw = { ...queryRaw, ref };
            logger.debug("Final string query: ", queryRaw);
        }
        else {
            logger.info("Incoming object query");
            logger.debug("Raw query: ", queryRaw);
        }
        const validateRawResult = validateRaw(this.config, queryRaw);
        if (validateRawResult !== true) {
            logger.warn("Raw validation failed:", validateRawResult);
            return validateRawResult;
        }
        const query = executeSheetAndReplaceVars(queryRaw, this.preDefinedSheets, user);
        logger.debug("Executed sheet (expanded query):", query);
        const validateVqlResult = validateVql(this.config, query);
        if (validateVqlResult !== true) {
            logger.warn("VQL validation failed:", validateVqlResult);
            return validateVqlResult;
        }
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
