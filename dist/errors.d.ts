import { ValtheraError } from "@wxn0brp/db-core/errors";
export declare const VQLErrorCodes: {
    readonly QUERY_PARSE: "VQL_QUERY_PARSE";
    readonly QUERY_VALIDATION: "VQL_QUERY_VALIDATION";
    readonly DB_NOT_FOUND: "VQL_DB_NOT_FOUND";
    readonly PERMISSION_DENIED: "VQL_PERMISSION_DENIED";
    readonly RELATION_INVALID: "VQL_RELATION_INVALID";
    readonly CONFIG_INVALID: "VQL_CONFIG_INVALID";
    readonly OPERATION_NOT_FOUND: "VQL_OPERATION_NOT_FOUND";
    readonly HANDLER_MISSING: "VQL_HANDLER_MISSING";
    readonly INTERNAL: "VQL_INTERNAL";
};
export type VQLErrorCode = (typeof VQLErrorCodes)[keyof typeof VQLErrorCodes];
export interface VQLErrorOpts {
    statusCode?: number;
    suggestion?: string;
    context?: Record<string, unknown>;
    cause?: unknown;
}
export declare class VQLError extends ValtheraError {
    statusCode: number;
    constructor(message: string, code: string, opts?: VQLErrorOpts);
}
export declare class VQLParseError extends VQLError {
    constructor(message: string, opts?: VQLErrorOpts);
}
export declare class VQLValidationError extends VQLError {
    constructor(message: string, opts?: VQLErrorOpts);
}
export declare class VQLDBNotFoundError extends VQLError {
    constructor(db: string, opts?: VQLErrorOpts);
}
export declare class VQLPermissionDeniedError extends VQLError {
    constructor(reason: string, opts?: VQLErrorOpts);
}
export declare class VQLRelationError extends VQLError {
    constructor(message: string, opts?: VQLErrorOpts);
}
export declare class VQLConfigError extends VQLError {
    constructor(message: string, opts?: VQLErrorOpts);
}
export declare class VQLOperationError extends VQLError {
    constructor(operation: string, opts?: VQLErrorOpts);
}
export declare class VQLHandlerMissingError extends VQLError {
    constructor(op: string, collection: string, opts?: VQLErrorOpts);
}
export declare class VQLInternalError extends VQLError {
    constructor(cause: unknown, opts?: VQLErrorOpts);
}
export declare function isVQLError(e: unknown): e is VQLError;
