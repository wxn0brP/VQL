import { ValtheraError } from "@wxn0brp/db-core/errors";

export const VQLErrorCodes = {
	QUERY_PARSE: "VQL_QUERY_PARSE",
	QUERY_VALIDATION: "VQL_QUERY_VALIDATION",
	DB_NOT_FOUND: "VQL_DB_NOT_FOUND",
	PERMISSION_DENIED: "VQL_PERMISSION_DENIED",
	RELATION_INVALID: "VQL_RELATION_INVALID",
	CONFIG_INVALID: "VQL_CONFIG_INVALID",
	OPERATION_NOT_FOUND: "VQL_OPERATION_NOT_FOUND",
	HANDLER_MISSING: "VQL_HANDLER_MISSING",
	INTERNAL: "VQL_INTERNAL",
} as const;

export type VQLErrorCode = (typeof VQLErrorCodes)[keyof typeof VQLErrorCodes];

export interface VQLErrorOpts {
	statusCode?: number;
	suggestion?: string;
	context?: Record<string, unknown>;
	cause?: unknown;
}

export class VQLError extends ValtheraError {
	statusCode: number;

	constructor(message: string, code: string, opts: VQLErrorOpts = {}) {
		super(message, {
			code,
			suggestion: opts.suggestion,
			context: opts.context,
			cause: opts.cause,
		});
		this.name = "VQLError";
		this.statusCode = opts.statusCode ?? 400;
	}
}

export class VQLParseError extends VQLError {
	constructor(message: string, opts?: VQLErrorOpts) {
		super(message, VQLErrorCodes.QUERY_PARSE, {
			statusCode: 400,
			...opts,
		});
		this.name = "VQLParseError";
	}
}

export class VQLValidationError extends VQLError {
	constructor(message: string, opts?: VQLErrorOpts) {
		super(message, VQLErrorCodes.QUERY_VALIDATION, {
			statusCode: 400,
			...opts,
		});
		this.name = "VQLValidationError";
	}
}

export class VQLDBNotFoundError extends VQLError {
	constructor(db: string, opts?: VQLErrorOpts) {
		super(`Database "${db}" not found`, VQLErrorCodes.DB_NOT_FOUND, {
			statusCode: 400,
			context: {
				db,
			},
			suggestion: "Check that the database was registered with VQLProcessor",
			...opts,
		});
		this.name = "VQLDBNotFoundError";
	}
}

export class VQLPermissionDeniedError extends VQLError {
	constructor(reason: string, opts?: VQLErrorOpts) {
		super(`Permission denied: ${reason}`, VQLErrorCodes.PERMISSION_DENIED, {
			statusCode: 403,
			context: {
				reason,
			},
			suggestion: "Check permissions for the user and collection",
			...opts,
		});
		this.name = "VQLPermissionDeniedError";
	}
}

export class VQLRelationError extends VQLError {
	constructor(message: string, opts?: VQLErrorOpts) {
		super(message, VQLErrorCodes.RELATION_INVALID, {
			statusCode: 400,
			...opts,
		});
		this.name = "VQLRelationError";
	}
}

export class VQLConfigError extends VQLError {
	constructor(message: string, opts?: VQLErrorOpts) {
		super(message, VQLErrorCodes.CONFIG_INVALID, {
			statusCode: 500,
			...opts,
		});
		this.name = "VQLConfigError";
	}
}

export class VQLOperationError extends VQLError {
	constructor(operation: string, opts?: VQLErrorOpts) {
		super(
			`Unknown operation "${operation}"`,
			VQLErrorCodes.OPERATION_NOT_FOUND,
			{
				statusCode: 500,
				context: {
					op: operation,
				},
				...opts,
			},
		);
		this.name = "VQLOperationError";
	}
}

export class VQLHandlerMissingError extends VQLError {
	constructor(op: string, collection: string, opts?: VQLErrorOpts) {
		super(
			`Unimplemented method: ${op}:${collection}`,
			VQLErrorCodes.HANDLER_MISSING,
			{
				statusCode: 501,
				context: {
					op,
					collection,
				},
				suggestion:
					"Register a handler for this operation+collection in AdapterBuilder",
				...opts,
			},
		);
		this.name = "VQLHandlerMissingError";
	}
}

export class VQLInternalError extends VQLError {
	constructor(cause: unknown, opts?: VQLErrorOpts) {
		super(
			cause instanceof Error ? cause.message : String(cause),
			VQLErrorCodes.INTERNAL,
			{
				statusCode: 500,
				cause,
				...opts,
			},
		);
		this.name = "VQLInternalError";
	}
}

export function isVQLError(e: unknown): e is VQLError {
	return e instanceof VQLError;
}
