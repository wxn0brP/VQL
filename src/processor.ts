import { Relation, ValtheraCompatible } from "@wxn0brp/db-core";
import { VQLConfig, VQLConfigInterface } from "./helpers/config";
import { executeRelation } from "./cpu/relation";
import { executeQuery } from "./cpu/request";
import logger from "./logger";
import { replaceVars } from "./helpers/sheet";
import { VQL_Query, VQLError, VQLUQ } from "./types/vql";
import { validateRaw, validateVql } from "./helpers/valid";
import { parseVQLS } from "./cpu/string";
import { PermValidFn } from "./types/perm";
import { VQLInternalError, VQLParseError } from "./errors";

export class VQLProcessor {
	public relation: Relation;
	public config: VQLConfig;

	constructor(
		public dbInstances: Record<string, ValtheraCompatible>,
		config: VQLConfig | Partial<VQLConfigInterface> = new VQLConfig(),
		public permValidFn: PermValidFn = async () => ({
			granted: true,
			via: "resolver",
			reason: "no-resolver-match",
		}),
	) {
		this.relation = new Relation(dbInstances);
		this.config = config instanceof VQLConfig ? config : new VQLConfig(config);
	}

	public async execute<T = any>(
		queryRaw: VQLUQ<T>,
		user: any = {
			_id: "null-null-null",
		},
		cfg: VQLConfig = this.config,
	): Promise<T | VQLError> {
		try {
			const result = this._preProcessQuery(queryRaw, user, cfg);
			if ("err" in result) return result.err;

			return await this._runQuery(result.query, user, cfg);
		} catch (e) {
			if (e instanceof VQLError) return e;
			if (e instanceof Error) return new VQLInternalError(e);
			return new VQLInternalError(String(e));
		}
	}

	public _preProcessQuery(
		queryRaw: VQLUQ,
		user: any,
		cfg: VQLConfig = this.config,
	): {
		query?: VQL_Query;
		err?: VQLError;
	} {
		const parseResult = this._parseQuery(queryRaw);
		if (parseResult.err)
			return {
				err: parseResult.err,
			};

		const parsedQuery = parseResult.query!;

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

	public _parseQuery(queryRaw: VQLUQ): {
		query?: VQL_Query;
		err?: VQLError;
	} {
		if (typeof queryRaw === "string" || "query" in queryRaw) {
			logger.info("Incoming string query");
			const q = typeof queryRaw === "string" ? queryRaw : queryRaw.query;
			const vars = typeof queryRaw === "string" ? null : queryRaw.var;
			logger.debug(q);

			try {
				queryRaw = parseVQLS(q);
				logger.debug("transformed query: ", queryRaw);
			} catch (e) {
				logger.error("Error parsing string query: ", {
					error: e,
					msg: e instanceof Error ? e.message : String(e),
				});
				return {
					err: new VQLParseError(
						//
						`String query parsing error: ${e instanceof Error ? e.message : String(e)}`,
						{
							context: {
								query: q,
							},
							cause: e,
						},
					),
				};
			}

			if (vars)
				queryRaw = {
					...queryRaw,
					var: vars,
				};
			logger.debug("Final string query: ", queryRaw);
		} else {
			logger.info("Incoming object query");
			logger.debug("Raw query: ", queryRaw);
		}

		return {
			query: queryRaw,
		};
	}

	public async _runQuery(
		query: VQL_Query,
		user: any,
		cfg: VQLConfig = this.config,
	): Promise<any> {
		if ("r" in query) {
			return await executeRelation(this, query, user, cfg);
		} else if ("d" in query) {
			return await executeQuery(this, query, user, cfg);
		} else {
			throw new VQLParseError("Invalid query", {
				context: {
					query,
				},
			});
		}
	}
}
