import { Relation } from "@wxn0brp/db-core";
import { VQLConfig } from "./helpers/config.js";
import { executeRelation } from "./cpu/relation.js";
import { executeQuery } from "./cpu/request.js";
import logger from "./logger.js";
import { replaceVars } from "./helpers/sheet.js";
import { VQLError } from "./types/vql.js";
import { validateRaw, validateVql } from "./helpers/valid.js";
import { parseVQLS } from "./cpu/string/index.js";
import { VQLInternalError, VQLParseError } from "./errors.js";
export class VQLProcessor {
    dbInstances;
    permValidFn;
    relation;
    config;
    constructor(dbInstances, config = new VQLConfig(), permValidFn = async () => ({
        granted: true,
        via: "resolver",
        reason: "no-resolver-match",
    })) {
        this.dbInstances = dbInstances;
        this.permValidFn = permValidFn;
        this.relation = new Relation(dbInstances);
        this.config = config instanceof VQLConfig ? config : new VQLConfig(config);
    }
    async execute(queryRaw, user = {
        _id: "null-null-null",
    }, cfg = this.config) {
        try {
            const result = this._preProcessQuery(queryRaw, user, cfg);
            if ("err" in result)
                return result.err;
            return await this._runQuery(result.query, user, cfg);
        }
        catch (e) {
            if (e instanceof VQLError)
                return e;
            if (e instanceof Error)
                return new VQLInternalError(e);
            return new VQLInternalError(String(e));
        }
    }
    _preProcessQuery(queryRaw, user, cfg = this.config) {
        const parseResult = this._parseQuery(queryRaw);
        if (parseResult.err)
            return {
                err: parseResult.err,
            };
        const parsedQuery = parseResult.query;
        const validateRawResult = validateRaw(parsedQuery);
        if (validateRawResult !== true) {
            logger.warn("Raw validation failed:", validateRawResult);
            return {
                err: validateRawResult,
            };
        }
        const query = replaceVars(parsedQuery, user);
        logger.debug("Executed sheet (expanded query):", query);
        const validateVqlResult = validateVql(query, cfg);
        if (validateVqlResult !== true) {
            logger.warn("VQL validation failed:", validateVqlResult);
            return {
                err: validateVqlResult,
            };
        }
        return {
            query,
        };
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
                logger.error("Error parsing string query: ", {
                    error: e,
                    msg: e instanceof Error ? e.message : String(e),
                });
                return {
                    err: new VQLParseError(
                    //
                    `String query parsing error: ${e instanceof Error ? e.message : String(e)}`, {
                        context: {
                            query: q,
                        },
                        cause: e,
                    }),
                };
            }
            if (vars)
                queryRaw = {
                    ...queryRaw,
                    var: vars,
                };
            logger.debug("Final string query: ", queryRaw);
        }
        else {
            logger.info("Incoming object query");
            logger.debug("Raw query: ", queryRaw);
        }
        return {
            query: queryRaw,
        };
    }
    async _runQuery(query, user, cfg = this.config) {
        if ("r" in query) {
            return await executeRelation(this, query, user, cfg);
        }
        else if ("d" in query) {
            return await executeQuery(this, query, user, cfg);
        }
        else {
            throw new VQLParseError("Invalid query", {
                context: {
                    query,
                },
            });
        }
    }
}
