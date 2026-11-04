# Troubleshooting

## The query returns an error object instead of throwing

`VQLProcessor.execute()` never throws for query failures. It returns a `VQLError`. Check the result:

```typescript
import { isVQLError } from "@wxn0brp/vql";

const result = await processor.execute(query, user);
if (isVQLError(result)) {
    console.error(result.code, result.message, result.suggestion);
}
```

See [Errors](../core/errors.md).

## Database "x" not found

The first argument to `VQLProcessor` is a name map:

```typescript
new VQLProcessor({
    main: dbMain,
    analytics: dbAnalytics
});
```

Queries use those names exactly:

```text
main users
```

Relation paths also use registered names: `path: ["analytics", "events"]`.

## "Invalid VQL query structure. Must contain 'r' or 'db' and 'd'."

The object has neither `r` nor a `db` + `d` pair.

```typescript
// Invalid
{ db: "main" }

// Valid
{ db: "main", d: { find: { collection: "users" } } }
{ r: { path: ["main", "users"], search: {}, relations: {} } }
```

## Validation errors

| Message | Fix |
|---------|-----|
| `CRUD operation 'x' must specify a non-empty 'collection' string.` | Add a collection name |
| `'findOne' operation requires a 'search' object.` | Add `search: {}` even for a match-all |
| `'update' operation requires an 'updater' object.` | Add `updater` |
| `'bulkAdd' operation requires a 'datas' array.` | Use an array |
| `'find' operation 'select' property must be an object or an array.` | Use `["name"]` or `{ name: 1 }`. The operation name is part of the message |
| `Relation query 'r.search' must be an object.` | Add `search: {}` |
| `Relation query 'r' must have a 'relations' object.` | Add `relations: {}` |
| `Relation 'x' has an invalid 'select' property; it must be an array.` | Use `select: ["name"]` |
| `Database "x" not found` | Register the name in the processor |

## Query returns an empty array

Check the search shape. Some operators expect nested field objects:

```typescript
// Wrong: this asks for a field called "$gt"
{ "$gt": 18 }

// Right
{ $gt: { age: 18 } }
```

Other causes:

- `s.age>18` in VQLS becomes `{ $gt: { age: 18 } }`, not a plain equality.
- Numeric strings must be quoted: `s.externalId="123"`.
- `select` does not filter records, it only projects fields.
- `options.limit` limits results. A top-level `limit` is ignored.
- If you sort with `sortBy` and also use `select`, include the sort field in the selection. Removing it can make the sort ineffective.
- A relation query with `many: false` returns one record or `null`.

## Fields are missing from the result

- `select` keeps only the listed fields.
- `searchOpts.exclude` removes fields.
- With permissions enabled, fields without `READ` are removed.
- VQLS `e.profile.city=1` selects the whole `profile` for CRUD operations. Use VQLR for a nested CRUD selection.

## Permission denied

Common causes:

1. **No user context.** `permissionDeniedIfNoUser` defaults to `true`. Only `null` is denied; `undefined` is replaced by the placeholder `{ _id: "null-null-null" }` and continues with a fake identity. Always pass a real user object.
2. **`strictSelect` missing.** Enabling permissions without `strictSelect: true` throws `VQLConfigError` at construction.
3. **Path mismatch.** Permission paths are `[database, collection, ...field]`. Check the exact spelling and casing.
4. **`hidePath` mismatch.** With `hidePath: true`, `args.field` is a SHA-256 hash. Rules registered with plain paths will not match.
5. **No resolver match.** `PermissionResolverEngine` denies when nothing matches. Add a `startsWith` or regex matcher, or use `createWithGw`.
6. **Gate Warden user missing.** `createGwValidFn` loads the user from the Gate Warden database. A missing user is reported as `user-404`.
7. **`entity-404` with `strictACL: true`.** Register the exact path or disable strict ACL to allow parent fallback.

Inspect the permission arguments:

```typescript
const permValidFn = async args => {
    console.dir(args);
    return { granted: false };
};
```

## Permission checks do not run

- `noCheckPermissions` defaults to `true`. Set it to `false`.
- `LowAdapter` resolvers bypass the permission layer. Authorize inside the resolver.
- If you pass a custom `permValidFn` that always returns `{ granted: true }`, every request is allowed.

## Relation errors

- `path` must be exactly two strings: `["db", "collection"]`.
- `search` and `relations` must exist, even when empty.
- Relation `select` is an array. In VQLS use JSON: `r.items.select=["name"]`.
- A missing database in any relation `path` throws `VQLDBNotFoundError`. A bad `through.db` is not pre-checked and fails later with `VQLInternalError`.
- `type: "nm"` requires `through.table`, `through.pk`, and `through.fk`.

See [Relations](../core/relations.md).

## VQLS parsing surprises

| Input | Result | Reason |
|-------|--------|--------|
| `db removeOne users! s._id="1"` | Collection `users!` | Explicit operations do not strip `!` |
| `s.active=` followed by another key | Wrong pair | Empty value consumes the next token |
| `s.name=Alice` | String `"Alice"` | Unquoted values stay strings |
| `s.id=123` | Number `123` | Quote to keep as string |
| `s.date=null` | String `"null"` | Use JSON: `s={"date":null}` |
| `s.a.b>1` | `{ $gt: { a: { b: 1 } } }` | Operators are applied operator-first |
| `s={"a": 1}` | Parsed incorrectly | JSON values must be compact |
| `r.orders.search.status="pending"` | Accepted but not applied | The relation loader ignores per-relation `search` |
| `e.profile.city=1` | Selects `profile` | CRUD selects collapse to top level |

Quoted values are needed for spaces, `=`, `<`, and `>`.

## HTTP endpoint returns 500

- The processor is returning a `VQLInternalError` from an unexpected exception. Enable logging at `DEBUG` and inspect the error.
- A custom adapter threw. `AdapterBuilder` swallows handler errors into `undefined`; pass a `catchCb` that logs.
- Falcon Frame did not parse the body. Make sure the request is JSON and the body uses the `query` key, or provide `getQuery`.

A `501` means no adapter handler exists for that operation and collection. Register one or add a `"*"` handler.

## TypeScript cannot find VQLUQ or VQL_Query

Types are published under subpaths, not the package root:

```typescript
import type { VQLUQ, VQL_Query } from "@wxn0brp/vql/types/vql";
```

Permission types:

```typescript
import { PermCRUD } from "@wxn0brp/vql/types/perm";
```

## Debug logging

```typescript
import { VQLLogger, VQLLogLevel } from "@wxn0brp/vql";

VQLLogger.logLevel = VQLLogLevel.DEBUG;
```

The logger prints incoming queries, expanded queries, validation failures, and internal errors. It may include user data, so disable it in production.

## Still stuck

Capture the failing query, the config, and the user context. Run the query through `processor._preProcessQuery(query, user)` to see whether it fails before execution:

```typescript
const prepared = processor._preProcessQuery(query, user);
console.dir(prepared, { depth: null });
```

## Next steps

- [Errors](../core/errors.md)
- [Configuration](../core/configuration.md)
- [Permissions](../core/permissions.md)
