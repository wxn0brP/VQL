import { Relation, ValtheraCompatible } from "@wxn0brp/db-core";
import { VQLConfig, VQLConfigInterface } from "./config";
import { executeRelation } from "./cpu/relation";
import { executeQuery } from "./cpu/request";
import logger from "./logger";
import { executeSheetAndReplaceVars } from "./sheet";
import { VQL, VQLError, VqlQueryRaw } from "./types/vql";
import { validateRaw, validateVql } from "./valid";
import { parseVQLS } from "./cpu/string";
import { ValidFn } from "./types/perm";

export class VQLProcessor {
    public relation: Relation;
    public preDefinedSheets: Map<string, VQL> = new Map();
    public config: VQLConfig;

    constructor(
        public dbInstances: Record<string, ValtheraCompatible>,
        config: VQLConfig | Partial<VQLConfigInterface> = new VQLConfig(),
        public validFn: ValidFn = async () => ({ granted: true, via: "" })
    ) {
        this.relation = new Relation(dbInstances);
        this.config = config instanceof VQLConfig ? config : new VQLConfig(config);
    }

    async execute<T = any>(queryRaw: VqlQueryRaw<T>, user: any = {}): Promise<T | VQLError> {
        if (typeof queryRaw === "string" || "query" in queryRaw) {
            logger.info("Incoming string query");
            const q = typeof queryRaw === "string" ? queryRaw : queryRaw.query;
            const vars = typeof queryRaw === "string" ? null : queryRaw.var;
            const ref = typeof queryRaw === "string" ? null : queryRaw.ref;
            logger.debug(q);

            try {
                queryRaw = parseVQLS(q);
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

        const query = executeSheetAndReplaceVars(queryRaw, this.preDefinedSheets, user);
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
