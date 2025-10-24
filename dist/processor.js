import { Relation } from "@wxn0brp/db-core";
import { VQLConfig } from "./helpers/config.js";
import { executeRelation } from "./cpu/relation.js";
import { executeQuery } from "./cpu/request.js";
import logger from "./logger.js";
import { replaceVars } from "./helpers/sheet.js";
import { validateRaw, validateVql } from "./helpers/valid.js";
import { parseVQLS } from "./cpu/string/index.js";
export class VQLProcessor {
    dbInstances;
    permValidFn;
    relation;
    config;
    constructor(dbInstances, config = new VQLConfig(), permValidFn = async () => ({ granted: true, via: "" })) {
        this.dbInstances = dbInstances;
        this.permValidFn = permValidFn;
        this.relation = new Relation(dbInstances);
        this.config = config instanceof VQLConfig ? config : new VQLConfig(config);
    }
    async execute(queryRaw, user = { _id: "null-null-null" }) {
        const result = this._preProcessQuery(queryRaw, user);
        if ("err" in result)
            return result.err;
        return await this._runQuery(result.query, user);
    }
    _preProcessQuery(queryRaw, user) {
        const { query: parsedQuery, err: parseErr } = this._parseQuery(queryRaw);
        if (parseErr) {
            return { err: parseErr };
        }
        const validateRawResult = validateRaw(parsedQuery);
        if (validateRawResult !== true) {
            logger.warn("Raw validation failed:", validateRawResult);
            return { err: validateRawResult };
        }
        const query = replaceVars(parsedQuery, user);
        logger.debug("Executed sheet (expanded query):", query);
        const validateVqlResult = validateVql(query);
        if (validateVqlResult !== true) {
            logger.warn("VQL validation failed:", validateVqlResult);
            return { err: validateVqlResult };
        }
        return { query };
    }
    _parseQuery(queryRaw) {
        if (typeof queryRaw === "string" || "query" in queryRaw) {
            logger.info("Incoming string query");
            const q = typeof queryRaw === "string" ? queryRaw : queryRaw.query;
            const vars = typeof queryRaw === "string" ? null : queryRaw.var;
            logger.debug(q);
            try {
                queryRaw = parseVQLS(q);
                logger.debug("transformed query: ", queryRaw);
            }
            catch (e) {
                logger.error("Error parsing string query: ", { error: e, msg: e.message });
                return {
                    err: { err: true, c: 400, msg: `String query parsing error: ${e.message}` }
                };
            }
            if (vars)
                queryRaw = { ...queryRaw, var: vars };
            logger.debug("Final string query: ", queryRaw);
        }
        else {
            logger.info("Incoming object query");
            logger.debug("Raw query: ", queryRaw);
        }
        return { query: queryRaw };
    }
    async _runQuery(query, user) {
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
