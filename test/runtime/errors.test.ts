import { describe, expect, it } from "bun:test";
import { createMemoryValthera } from "@wxn0brp/db-core";
import { ValtheraError } from "@wxn0brp/db-core/errors";
import { VQLConfig } from "../../src/helpers/config";
import { createVqlRouteHandler } from "../../src/helpers/falconFrame";
import {
	AdapterBuilder,
	createValtheraAdapter,
} from "../../src/helpers/apiAbstract";
import { VQLProcessor } from "../../src/processor";
import {
	VQLConfigError,
	VQLDBNotFoundError,
	VQLError,
	VQLErrorCodes,
	VQLHandlerMissingError,
	VQLInternalError,
	VQLOperationError,
	VQLParseError,
	VQLPermissionDeniedError,
	VQLRelationError,
	VQLValidationError,
	isVQLError,
} from "../../src/errors";

function createProcessor(
	config: VQLConfig = new VQLConfig(),
	permValidFn?: any,
) {
	const db = createMemoryValthera({
		users: [
			{
				_id: 1,
				name: "Mara",
			},
		],
	});
	return new VQLProcessor(
		{
			db,
		},
		config,
		permValidFn,
	);
}

function createRes() {
	const calls: number[] = [];
	const res = {
		calls,
		status(code: number) {
			calls.push(code);
			return this;
		},
	};
	return res;
}

async function callHandler(handler: any, query: any, res: any) {
	return await handler(
		{
			body: {
				query,
			},
		},
		res,
	);
}

describe("Errors/VQLError", () => {
	it("uses defaults for status and payload", () => {
		const err = new VQLError(
			//
			"boom",
			"CUSTOM",
		);

		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(ValtheraError);
		expect(err).toBeInstanceOf(VQLError);
		expect(err.name).toBe("VQLError");
		expect(err.message).toBe("boom");
		expect(err.code).toBe("CUSTOM");
		expect(err.statusCode).toBe(400);
		expect(err.suggestion).toBeUndefined();
		expect(err.context).toBeUndefined();
	});

	it("keeps status, suggestion, context and cause", () => {
		const cause = new Error("low level");
		const err = new VQLError(
			//
			"boom",
			"CUSTOM",
			{
				statusCode: 418,
				suggestion: "try again",
				context: {
					field: "name",
				},
				cause,
			},
		);

		expect(err.statusCode).toBe(418);
		expect(err.suggestion).toBe("try again");
		expect(err.context).toEqual({
			field: "name",
		});
		expect(err.cause).toBe(cause);
	});

	it("serializes structured fields to JSON", () => {
		const err = new VQLError(
			//
			"boom",
			"CUSTOM",
			{
				statusCode: 409,
				suggestion: "fix it",
				context: {
					id: 1,
				},
			},
		);

		expect(err.toJSON()).toEqual({
			name: "VQLError",
			code: "CUSTOM",
			message: "boom",
			suggestion: "fix it",
			context: {
				id: 1,
			},
		});
	});

	it("exposes a complete code catalog", () => {
		expect(new Set(Object.values(VQLErrorCodes))).toEqual(
			new Set([
				"VQL_QUERY_PARSE",
				"VQL_QUERY_VALIDATION",
				"VQL_DB_NOT_FOUND",
				"VQL_PERMISSION_DENIED",
				"VQL_RELATION_INVALID",
				"VQL_CONFIG_INVALID",
				"VQL_OPERATION_NOT_FOUND",
				"VQL_HANDLER_MISSING",
				"VQL_INTERNAL",
			]),
		);
	});

	it("isVQLError accepts VQL errors only", () => {
		expect(
			isVQLError(
				new VQLParseError(
					//
					"bad",
				),
			),
		).toBe(true);
		expect(isVQLError(new Error("bad"))).toBe(false);
		expect(
			isVQLError({
				code: VQLErrorCodes.QUERY_PARSE,
			}),
		).toBe(false);
		expect(isVQLError(null)).toBe(false);
	});
});

describe("Errors/classes", () => {
	it("VQLParseError", () => {
		const err = new VQLParseError("bad query");

		expect(err.name).toBe("VQLParseError");
		expect(err.code).toBe(VQLErrorCodes.QUERY_PARSE);
		expect(err.statusCode).toBe(400);
	});

	it("VQLValidationError", () => {
		const err = new VQLValidationError("bad query");

		expect(err.name).toBe("VQLValidationError");
		expect(err.code).toBe(VQLErrorCodes.QUERY_VALIDATION);
		expect(err.statusCode).toBe(400);
	});

	it("VQLDBNotFoundError carries db context and suggestion", () => {
		const err = new VQLDBNotFoundError(
			//
			"shop",
		);

		expect(err.name).toBe("VQLDBNotFoundError");
		expect(err.code).toBe(VQLErrorCodes.DB_NOT_FOUND);
		expect(err.statusCode).toBe(400);
		expect(err.message).toBe('Database "shop" not found');
		expect(err.context).toEqual({
			db: "shop",
		});
		expect(err.suggestion).toBe(
			"Check that the database was registered with VQLProcessor",
		);
	});

	it("VQLPermissionDeniedError carries reason and status 403", () => {
		const err = new VQLPermissionDeniedError("no access");

		expect(err.name).toBe("VQLPermissionDeniedError");
		expect(err.code).toBe(VQLErrorCodes.PERMISSION_DENIED);
		expect(err.statusCode).toBe(403);
		expect(err.message).toBe("Permission denied: no access");
		expect(err.context).toEqual({
			reason: "no access",
		});
	});

	it("VQLRelationError", () => {
		const err = new VQLRelationError("bad relation");

		expect(err.name).toBe("VQLRelationError");
		expect(err.code).toBe(VQLErrorCodes.RELATION_INVALID);
		expect(err.statusCode).toBe(400);
	});

	it("VQLConfigError", () => {
		const err = new VQLConfigError("bad config");

		expect(err.name).toBe("VQLConfigError");
		expect(err.code).toBe(VQLErrorCodes.CONFIG_INVALID);
		expect(err.statusCode).toBe(500);
	});

	it("VQLOperationError carries operation context", () => {
		const err = new VQLOperationError(
			//
			"deleteAll",
		);

		expect(err.name).toBe("VQLOperationError");
		expect(err.code).toBe(VQLErrorCodes.OPERATION_NOT_FOUND);
		expect(err.statusCode).toBe(500);
		expect(err.message).toBe('Unknown operation "deleteAll"');
		expect(err.context).toEqual({
			op: "deleteAll",
		});
	});

	it("VQLHandlerMissingError carries op, collection and suggestion", () => {
		const err = new VQLHandlerMissingError(
			//
			"find",
			"users",
		);

		expect(err.name).toBe("VQLHandlerMissingError");
		expect(err.code).toBe(VQLErrorCodes.HANDLER_MISSING);
		expect(err.statusCode).toBe(501);
		expect(err.message).toBe("Unimplemented method: find:users");
		expect(err.context).toEqual({
			op: "find",
			collection: "users",
		});
		expect(err.suggestion).toBe(
			"Register a handler for this operation+collection in AdapterBuilder",
		);
	});

	it("VQLInternalError preserves the cause", () => {
		const cause = new Error("boom");
		const err = new VQLInternalError(cause);

		expect(err.name).toBe("VQLInternalError");
		expect(err.code).toBe(VQLErrorCodes.INTERNAL);
		expect(err.statusCode).toBe(500);
		expect(err.message).toBe("boom");
		expect(err.cause).toBe(cause);

		const fromString = new VQLInternalError("plain failure");
		expect(fromString.message).toBe("plain failure");
		expect(fromString.cause).toBe("plain failure");
	});

	it("opts override defaults", () => {
		const err = new VQLDBNotFoundError(
			//
			"shop",
			{
				statusCode: 404,
				suggestion: "custom",
				context: {
					reason: "custom",
				},
			},
		);

		expect(err.statusCode).toBe(404);
		expect(err.suggestion).toBe("custom");
		expect(err.context).toEqual({
			reason: "custom",
		});
	});

	it("VQLConfig rejects insecure permission configuration", () => {
		expect(
			() =>
				new VQLConfig({
					noCheckPermissions: false,
					strictSelect: false,
				}),
		).toThrow(VQLConfigError);
	});
});

describe("Errors/processor", () => {
	it("returns a VQLParseError for malformed strings", async () => {
		const processor = createProcessor();
		const result = await processor.execute("broken");

		expect(result).toBeInstanceOf(VQLParseError);
		expect((result as VQLParseError).code).toBe(VQLErrorCodes.QUERY_PARSE);
		expect((result as VQLParseError).context).toEqual({
			query: "broken",
		});
	});

	it("returns a VQLValidationError for invalid query shape", async () => {
		const processor = createProcessor();
		const result = await processor.execute({} as any);

		expect(result).toBeInstanceOf(VQLValidationError);
		expect((result as VQLValidationError).code).toBe(
			VQLErrorCodes.QUERY_VALIDATION,
		);
	});

	it("returns a VQLDBNotFoundError for an unknown database", async () => {
		const processor = createProcessor();
		const result = await processor.execute({
			db: "missing",
			d: {
				find: {
					collection: "users",
				},
			},
		});

		expect(result).toBeInstanceOf(VQLDBNotFoundError);
		expect((result as VQLDBNotFoundError).context).toEqual({
			db: "missing",
		});
	});

	it("returns a VQLDBNotFoundError for relation queries", async () => {
		const processor = createProcessor();
		const result = await processor.execute({
			r: {
				path: [
					"missing",
					"users",
				],
				search: {},
				relations: {},
			},
		});

		expect(result).toBeInstanceOf(VQLDBNotFoundError);
		expect((result as VQLDBNotFoundError).context).toEqual({
			db: "missing",
		});
	});

	it("returns a VQLPermissionDeniedError for CRUD queries", async () => {
		const processor = createProcessor(
			new VQLConfig({
				noCheckPermissions: false,
				strictSelect: true,
			}),
			async () => ({
				granted: false,
				via: "resolver",
				reason: "denied",
			}),
		);
		const result = await processor.execute({
			db: "db",
			d: {
				find: {
					collection: "users",
				},
			},
		});

		expect(result).toBeInstanceOf(VQLPermissionDeniedError);
		expect((result as VQLPermissionDeniedError).statusCode).toBe(403);
	});

	it("returns a VQLPermissionDeniedError for relation queries", async () => {
		const processor = createProcessor(
			new VQLConfig({
				noCheckPermissions: false,
				strictSelect: true,
			}),
			async () => ({
				granted: false,
				via: "resolver",
				reason: "denied",
			}),
		);
		const result = await processor.execute({
			r: {
				path: [
					"db",
					"users",
				],
				search: {},
				relations: {},
			},
		});

		expect(result).toBeInstanceOf(VQLPermissionDeniedError);
	});

	it("wraps unexpected errors into VQLInternalError", async () => {
		const db = createMemoryValthera({
			users: [],
		});
		const originalC = db.c.bind(db);
		db.c = (collection: string) => {
			const col = originalC(collection);
			col.find = async () => {
				throw new Error("driver failure");
			};
			return col;
		};

		const processor = new VQLProcessor({
			db,
		});
		const result = await processor.execute({
			db: "db",
			d: {
				find: {
					collection: "users",
				},
			},
		});

		expect(result).toBeInstanceOf(VQLInternalError);
		expect((result as VQLInternalError).message).toBe("driver failure");
		expect((result as VQLInternalError).cause).toBeInstanceOf(Error);
	});
});

describe("Errors/adapter", () => {
	it("AdapterBuilder throws VQLHandlerMissingError", async () => {
		const adapter = new AdapterBuilder().getAdapter();

		const error = await adapter
			.find({
				collection: "missing",
			} as any)
			.catch((e: unknown) => e);

		expect(error).toBeInstanceOf(VQLHandlerMissingError);
		expect((error as VQLHandlerMissingError).statusCode).toBe(501);
		expect((error as VQLHandlerMissingError).context).toEqual({
			op: "find",
			collection: "missing",
		});
	});

	it("createValtheraAdapter throws VQLOperationError for missing resolver", async () => {
		const adapter = createValtheraAdapter({});
		let error: unknown;

		try {
			await adapter.find({
				collection: "users",
			} as any);
		} catch (e) {
			error = e;
		}

		expect(error).toBeInstanceOf(VQLOperationError);
		expect((error as VQLOperationError).code).toBe(
			VQLErrorCodes.OPERATION_NOT_FOUND,
		);
	});
});

describe("Errors/HTTP route", () => {
	it("returns a successful payload", async () => {
		const handler = createVqlRouteHandler(createProcessor());
		const res = createRes();
		const body = await callHandler(
			handler,
			{
				db: "db",
				d: {
					find: {
						collection: "users",
					},
				},
			},
			res,
		);

		expect(body).toEqual({
			err: false,
			result: [
				{
					_id: 1,
					name: "Mara",
				},
			],
		});
		expect(res.calls).toEqual([]);
	});

	it("serializes a returned VQLError with its status", async () => {
		const handler = createVqlRouteHandler(createProcessor());
		const res = createRes();
		const body = await callHandler(handler, "broken", res);

		expect(body).toMatchObject({
			err: true,
			c: 400,
			code: VQLErrorCodes.QUERY_PARSE,
			context: {
				query: "broken",
			},
		});
		expect(body.msg).toContain("String query parsing error");
		expect(res.calls).toEqual([
			400,
		]);
	});

	it("serializes suggestion and context for a missing database", async () => {
		const handler = createVqlRouteHandler(createProcessor());
		const res = createRes();
		const body = await callHandler(
			handler,
			{
				db: "missing",
				d: {
					find: {
						collection: "users",
					},
				},
			},
			res,
		);

		expect(body).toMatchObject({
			err: true,
			c: 400,
			code: VQLErrorCodes.DB_NOT_FOUND,
			suggestion: "Check that the database was registered with VQLProcessor",
			context: {
				db: "missing",
			},
		});
		expect(res.calls).toEqual([
			400,
		]);
	});

	it("wraps raw thrown errors as adapter errors", async () => {
		const handler = createVqlRouteHandler(createProcessor(), {
			getUser: async () => {
				throw new Error("auth failure");
			},
		});
		const res = createRes();
		const body = await handler(
			{
				body: {},
			} as any,
			res as any,
			() => {},
		);

		expect(body).toMatchObject({
			err: true,
			msg: "auth failure",
			c: 500,
			code: "ADAPTER_ERROR",
		});
		expect(res.calls).toEqual([
			500,
		]);
	});

	it("keeps the status of a thrown VQLError", async () => {
		const handler = createVqlRouteHandler(createProcessor(), {
			getQuery: () => {
				throw new VQLPermissionDeniedError(
					//
					"not logged in",
				);
			},
		});
		const res = createRes();
		const body = await handler(
			{
				body: {},
			} as any,
			res as any,
			() => {},
		);

		expect(body).toMatchObject({
			err: true,
			c: 403,
			code: VQLErrorCodes.PERMISSION_DENIED,
		});
		expect(res.calls).toEqual([
			403,
		]);
	});
});
