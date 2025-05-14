import { Relation, ValtheraCompatible } from "@wxn0brp/db";
import { GateWarden } from "@wxn0brp/gate-warden";
import { VQL, VQLR, VQLRef } from "./types/vql";
import { validateRaw, validateVql } from "./valid";
import { executeSheet } from "./sheet";
import { executeQuery } from "./cpu/request";
import { executeRelation } from "./cpu/relation";
import { parseStringQuery } from "./cpu/string";
import logger from "./logger";

export class VQLProcessor<GW = any> {
    public relation: Relation;
    public preDefinedSheets: Map<string, VQL> = new Map();

    constructor(
        public dbInstances: Record<string, ValtheraCompatible>,
        public gw: GateWarden<GW> = null
    ) {
        this.relation = new Relation(dbInstances);
    }

    async execute(queryRaw: VQLR | string | { query: string } & VQLRef, user: any): Promise<any> {
        if (typeof queryRaw === "string" || "query" in queryRaw) {
            logger.info("Incoming string query");
            const q =    typeof queryRaw === "string" ? queryRaw : queryRaw.query;
            const vars = typeof queryRaw === "string" ? null : queryRaw.var;
            const ref =  typeof queryRaw === "string" ? null : queryRaw.ref;
            logger.debug(q);

            try {
                queryRaw = parseStringQuery(q);
                logger.debug("transformed query: ", queryRaw);
            } catch (e) {
                logger.error("Error parsing string query: ", { error: e, msg: e.message });
                return { err: true, msg: "Invalid query", c: 400, why: `String query parsing error: ${e.message}` };
            }

            if (vars) queryRaw = { ...queryRaw, var: vars };
            if (ref) queryRaw = { ...queryRaw, ref };
            logger.debug("Final string query: ", queryRaw);
        } else {
            logger.info("Incoming object query");
            logger.debug("Raw query: ", queryRaw);
        }

        const validateRawResult = validateRaw(queryRaw);
        if (validateRawResult !== true) {
            logger.warn("Raw validation failed:", validateRawResult);
            return validateRawResult;
        }

        const query = executeSheet(queryRaw, this.preDefinedSheets);
        logger.debug("Executed sheet (expanded query):", query);

        const validateVqlResult = validateVql(query);
        if (validateVqlResult !== true) {
            logger.warn("VQL validation failed:", validateVqlResult);
            return validateVqlResult;
        }

        if ("r" in query) {
            return await executeRelation(this, query, user);
        } else if ("d" in query) {
            return await executeQuery(this, query, user);
        } else {
            return { err: true, msg: "Invalid query", c: 400 };
        }
    }
}
