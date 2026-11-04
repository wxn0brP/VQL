# Errors

VQL never throws from `VQLProcessor.execute()` itself. It catches failures and returns a `VQLError` instance instead, so every call has a value-shaped result. Argument evaluation happens before the call: a `new VQLConfig(...)` with an invalid combination throws while the argument is built.

```typescript
const result = await processor.execute(query, user);
if (result instanceof Error) {
    // VQLError
} else {
    // data
}
```

`isVQLError` narrows the type:

```typescript
import { isVQLError } from "@wxn0brp/vql";

if (isVQLError(result)) {
    console.error(result.code, result.message);
}
```

Errors thrown by lower layers during execution are wrapped into `VQLInternalError` unless they are already a `VQLError`.

## Error shape

```typescript
class VQLError extends ValtheraError {
    statusCode: number;
    code: string;
    suggestion?: string;
    context?: Record<string, unknown>;
    cause?: unknown;
}
```

| Field | Description |
|-------|-------------|
| `name` | Class name, for example `VQLParseError` |
| `message` | Human-readable message |
| `code` | Stable code from `VQLErrorCodes` |
| `statusCode` | Suggested HTTP status |
| `suggestion` | Optional remediation hint |
| `context` | Optional structured details |
| `cause` | Original error, when wrapped |

`toJSON()` returns `name`, `code`, `message`, optional `suggestion`, and optional `context`.

## Codes and classes

| Code | Class | HTTP status | Raised when |
|------|-------|-------------|-------------|
| `VQL_QUERY_PARSE` | `VQLParseError` | 400 | String query cannot be parsed |
| `VQL_QUERY_VALIDATION` | `VQLValidationError` | 400 | Query structure fails validation |
| `VQL_DB_NOT_FOUND` | `VQLDBNotFoundError` | 400 | Database name is not registered |
| `VQL_PERMISSION_DENIED` | `VQLPermissionDeniedError` | 403 | Permission function denied the request |
| `VQL_RELATION_INVALID` | `VQLRelationError` | 400 | Reserved. Relation failures currently use validation, database, or permission errors |
| `VQL_CONFIG_INVALID` | `VQLConfigError` | 500 | Invalid config combination |
| `VQL_OPERATION_NOT_FOUND` | `VQLOperationError` | 500 | Unknown CRUD operation |
| `VQL_HANDLER_MISSING` | `VQLHandlerMissingError` | 501 | Adapter has no handler for operation and collection |
| `VQL_INTERNAL` | `VQLInternalError` | 500 | Unexpected failure during execution |

All classes are exported from the package root:

```typescript
import {
    VQLError,
    VQLParseError,
    VQLValidationError,
    VQLDBNotFoundError,
    VQLPermissionDeniedError,
    VQLRelationError,
    VQLConfigError,
    VQLOperationError,
    VQLHandlerMissingError,
    VQLInternalError,
    VQLErrorCodes,
    isVQLError
} from "@wxn0brp/vql";
```

## Examples

**Database not registered**

```typescript
const result = await processor.execute({ db: "missing", d: { getCollections: {} } });
// VQLDBNotFoundError
// message: Database "missing" not found
// suggestion: Check that the database was registered with VQLProcessor
// context: { db: "missing" }
```

**Invalid query shape**

```typescript
await processor.execute({ db: "main" } as any);
// VQLValidationError: Invalid VQL query structure. Must contain 'r' or 'db' and 'd'.
```

**Missing collection**

```typescript
await processor.execute({ db: "main", d: { find: { collection: "" } } });
// VQLValidationError: CRUD operation 'find' must specify a non-empty 'collection' string.
```

**Permission denied**

```typescript
// VQLPermissionDeniedError
// statusCode: 403
// message: Permission denied: operation not permitted
```

**Missing adapter handler**

```typescript
// VQLHandlerMissingError
// statusCode: 501
// message: Unimplemented method: find:users
// suggestion: Register a handler for this operation+collection in AdapterBuilder
```

## Validation errors

`validateRaw` runs before variable replacement and checks only the top-level shape:

```text
Invalid VQL query structure. Must contain 'r' or 'db' and 'd'.
```

`validateVql` runs after variable replacement and performs the detailed checks:

- The first key in `d` must be a known operation. Additional keys are ignored.
- Collection names must be non-empty strings.
- `options`, `searchOpts`, `data`, and `add_arg` must be objects when present.
- `search` is required for `findOne`/`f`, `update`, `updateOne`, `remove`, `removeOne`, `updateOneOrAdd`, and `toggleOne`; it is optional for `find` and `count`.
- `updater` is required for `update`, `updateOne`, and `updateOneOrAdd`.
- `limit` must be a number when present.
- `select` must be an object or an array.
- `datas` must be an array.
- Relation paths must be arrays of length two. Element types are not checked.
- Nested relation `select` must be an array. Top-level `r.select` may be an object or an array.
- Relation `search` and `relations` must be objects.

The full list of messages is in `src/helpers/valid.ts`.

## Error handling patterns

**Fail the request**

```typescript
const result = await processor.execute(query, user);
if (isVQLError(result)) throw new Error(`${result.code}: ${result.message}`);
```

**Map to an HTTP response**

```typescript
if (isVQLError(result)) {
    res.status(result.statusCode).json({
        err: true,
        msg: result.message,
        code: result.code,
        suggestion: result.suggestion,
        context: result.context
    });
}
```

`FF_VQL` does this automatically. See [HTTP Integration](../integration/http.md).

**Log and fall back**

```typescript
const result = await processor.execute(query, user);
if (isVQLError(result)) {
    logger.error(result.toJSON());
    return fallbackValue;
}
return result;
```

## Next steps

- [HTTP Integration](../integration/http.md)
- [Troubleshooting](../guide/troubleshooting.md)
