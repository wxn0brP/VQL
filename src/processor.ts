import { Relation, ValtheraCompatible } from "@wxn0brp/db-core";
import { VQLConfig, VQLConfigInterface } from "./config";
import { executeRelation } from "./cpu/relation";
import { executeQuery } from "./cpu/request";
import logger from "./logger";
import { replaceVars } from "./sheet";
import { VQL_Query, VQLError, VQLUQ } from "./types/vql";
import { validateRaw, validateVql } from "./valid";
import { parseVQLS } from "./cpu/string";
import { PermValidFn } from "./types/perm";
import { createVqlProxyDb } from "./vqlMesh";

export class VQLProcessor {
    public relation: Relation;
    public config: VQLConfig;

    constructor(
        public dbInstances: Record<string, ValtheraCompatible>,
        config: VQLConfig | Partial<VQLConfigInterface> = new VQLConfig(),
        public permValidFn: PermValidFn = async () => ({ granted: true, via: "" }),
        vqlMesh: VQLProcessor[] = []
    ) {
        for (const remoteVql of vqlMesh) {
            const remoteDbs = Object.keys(remoteVql.dbInstances);
            for (const dbName of remoteDbs) {
                if (!this.dbInstances[dbName]) {
                    logger.info(`[VQL Mesh] Creating proxy for remote database: ${dbName}`);
                    this.dbInstances[dbName] = createVqlProxyDb(remoteVql, dbName);
                } else {
                    logger.info(`[VQL Mesh] Skipping remote database "${dbName}" as it already exists locally.`);
                }
            }
        }

        this.relation = new Relation(dbInstances);
        this.config = config instanceof VQLConfig ? config : new VQLConfig(config);
    }

    public async execute<T = any>(queryRaw: VQLUQ<T>, user: any = { _id: "null-null-null" }): Promise<T | VQLError> {
        const result = this._preProcessQuery(queryRaw, user);
        if ("err" in result) return result.err;

        return await this._runQuery(result.query, user);
    }

    public _preProcessQuery(queryRaw: VQLUQ, user: any) {
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

    public _parseQuery(queryRaw: VQLUQ): { query?: VQL_Query; err?: VQLError } {
        if (typeof queryRaw === "string" || "query" in queryRaw) {
            logger.info("Incoming string query");
            const q = typeof queryRaw === "string" ? queryRaw : queryRaw.query;
            const vars = typeof queryRaw === "string" ? null : queryRaw.var;
            logger.debug(q);

            try {
                queryRaw = parseVQLS(q);
                logger.debug("transformed query: ", queryRaw);
            } catch (e) {
                logger.error("Error parsing string query: ", { error: e, msg: e.message });
                return {
                    err: { err: true, c: 400, msg: `String query parsing error: ${e.message}` }
                };
            }

            if (vars) queryRaw = { ...queryRaw, var: vars };
            logger.debug("Final string query: ", queryRaw);
        } else {
            logger.info("Incoming object query");
            logger.debug("Raw query: ", queryRaw);
        }

        return { query: queryRaw }
    }

    public async _runQuery(query: VQL_Query, user: any) {
        if ("r" in query) {
            return await executeRelation(this, query, user);
        } else if ("d" in query) {
            return await executeQuery(this, query, user);
        } else {
            return { err: true, msg: "Invalid query", c: 400 };
        }
    }
}
