# Permissions

VQL includes an optional, path-based permission layer. It is disabled by default so that local scripts and trusted server code do not need any setup.

Permissions have two jobs:

1. Check whether an operation may touch a database, collection, or field.
2. Remove fields the user cannot read from returned records.

## Enabling permissions

```typescript
import VQLProcessor, { VQLConfig } from "@wxn0brp/vql";

const processor = new VQLProcessor(
    dbInstances,
    new VQLConfig({
        noCheckPermissions: false,
        strictSelect: true,
        strictACL: true
    }),
    permValidFn
);
```

`strictSelect` must be `true` when permissions are enabled. Otherwise the config constructor throws `VQLConfigError`.

If no `permValidFn` is passed, the default function grants every request. That is useful while wiring the rest of the system, but it means `noCheckPermissions: false` alone does not secure anything.

## Permission function

```typescript
type PermValidFn = (args: PermValidFnArgs) => Promise<ValidFnResult>;

interface PermValidFnArgs {
    field: string;    // JSON path, or sha256 hash when hidePath is true
    path: string[];   // original path segments
    p: number;        // CRUD bitmask
    user: any;        // user context passed to execute()
}

interface ValidFnResult {
    granted: boolean;
    via?: "resolver" | "gate-warden";
    reason?: string;
}
```

Minimal implementation:

```typescript
import { PermCRUD } from "@wxn0brp/vql/types/perm";

const permValidFn = async ({ path, p, user }) => {
    const [db, collection] = path;

    if (user?.role === "admin") {
        return { granted: true, via: "resolver", reason: "admin" };
    }

    if (db === "public" && collection === "posts" && p & PermCRUD.READ) {
        return { granted: true, via: "resolver", reason: "public-read" };
    }

    return { granted: false, via: "resolver", reason: "not-permitted" };
};
```

## CRUD flags

```typescript
import { PermCRUD } from "@wxn0brp/vql/types/perm";

enum PermCRUD {
    CREATE = 1,
    READ = 2,
    UPDATE = 4,
    DELETE = 8,
    COLLECTION = 16
}
```

Flags are bit values. Combine them with `|` and test them with `&`.

## Paths

Collection-level checks use:

```text
[database, collection]
```

Field-level checks use:

```text
[database, collection, ...fieldPath]
```

For example, selecting `users.email` from `main` produces:

```text
["main", "users", "email"]
```

When `hidePath` is `true`, the `field` argument is the SHA-256 hash of the JSON encoded path. The `path` argument always contains the original segments.

## Operation mapping

| Operation | Collection check | Field checks |
|-----------|------------------|--------------|
| `find`, `findOne`, `f` | `READ` | `search` paths: `READ` |
| `add` | `CREATE` | none |
| `update`, `updateOne` | none | `search` paths: `READ`, `updater` paths: `UPDATE` |
| `remove`, `removeOne` | `DELETE` | none |
| `updateOneOrAdd` | `CREATE` | `search` paths: `READ`, `updater` paths: `UPDATE` |
| `toggleOne` | `CREATE` and `DELETE` | none |
| `count` | `READ` | `search` paths: `READ` |
| `bulkAdd` | `CREATE` | none |
| `ensureCollection`, `issetCollection`, `removeCollection`, `getCollections` | `COLLECTION` | none |

Notes:

- `add` and `bulkAdd` do not validate the payload fields. Validate user input separately if field-level write limits matter.
- `remove` does not check search fields, only the collection `DELETE` flag.
- Every required check must pass.
- Collection operations use the collection name as part of the path. For `getCollections` the collection segment is an empty string.

### Operator paths

Search and updater objects are flattened to field paths. Operator keys such as `$gt`, `$in`, and `$or` are skipped, so a condition on `age` is checked as `age`, not `$gt.age`.

`$subset` is an exception: it means "the following path is literal data", so the segments after `$subset` are kept.

```typescript
{ $gt: { age: 18 } }              // path: ["main","users","age"]
{ $subset: { $ref: "abc" } }      // path: ["main","users","$ref"]
```

## Field filtering

After an operation returns records, VQL walks every path in each object and asks for `READ` permission. Denied paths are removed from the result.

```typescript
// Stored record
{ _id: "1", name: "Alice", email: "a@x.com", salary: 9000 }

// User can read _id, name, email but not salary
{ _id: "1", name: "Alice", email: "a@x.com" }
```

Filtering applies to:

- `find`, `findOne`
- `add`, `bulkAdd` (the returned records)
- `update`, `updateOne`, `remove`, `removeOne`
- `updateOneOrAdd`, `toggleOne` (the `data` field)

Relation results are not field-filtered after loading. The permission layer checks the relation path, search fields, and selected fields before execution, so omit the relation key or select only permitted fields. `count` returns a number and is not filtered.

## Fallback and strictACL

A permission function can report `reason: "entity-404"` when the requested path is not registered.

- `strictACL: false` (default): a denied field path is retried with parent paths, walking up from field to collection to database. Collection-level checks do not fall back to the database.
- `strictACL: true`: the denial is final.

This allows a field-level grant to live on a parent path:

```typescript
// Grant all fields under main/users, strictACL: false
permValidFn = async ({ path }) => {
    if (path[0] === "main" && path[1] === "users") {
        return { granted: true };
    }
    return { granted: false, reason: "entity-404" };
};
```

With `strictACL: true`, the same function still grants `main/users` and its fields because the prefix matches. A function that only returns `entity-404` for unknown paths would deny them instead.

## Missing user

If `permissionDeniedIfNoUser` is `true` (default) and the user context is falsy, the request is denied before any check. In practice only `null` triggers the denial: `execute()` replaces `undefined` with the placeholder `{ _id: "null-null-null" }`, and the HTTP helper defaults to `{}` when no `getUser` function is provided. Both values are truthy but usually not what you want. Always pass a real context in production and return `null` from `getUser` for anonymous requests.

## PermissionResolverEngine

`PermissionResolverEngine` builds a `PermValidFn` from path matchers. The first matching resolver wins. If nothing matches, the request is denied.

```typescript
import { PermissionResolverEngine } from "@wxn0brp/vql/permissions/resolver";
import { PermCRUD } from "@wxn0brp/vql/types/perm";

const engine = new PermissionResolverEngine();

// Exact path
engine.addResolver("main/users/email", async ({ user }) => {
    return user?.role === "admin";
});

// Any password field
engine.addResolver("password", async () => false, "endsWith");

// Admin access to a collection
engine.addResolver("main/users", async ({ user, p }) => {
    return user?.role === "admin" || (p & PermCRUD.READ) !== 0;
});

// Regular expression
engine.addResolver(/^main\/public\//, async () => true);

// Custom function
engine.addResolver(
    (path, segments) => segments[1] === "posts",
    async ({ user }) => !!user
);

const permValidFn = engine.create();
```

### Matchers

| Matcher | Example | Description |
|---------|---------|-------------|
| `string` | `"main/users/email"` | String mode, exact by default |
| `RegExp` | `/password$/` | `test()` against the joined path |
| `function` | `(path, segments) => boolean` | Custom predicate, may be async |

String modes:

```typescript
engine.addResolver("password", resolver, "endsWith");     // main/users/password
engine.addResolver("main/", resolver, "startsWith");      // main/users
engine.addResolver("secret", resolver, "includes");       // config/secret_key
engine.addResolver("main/users/email", resolver);         // exact
```

The joined path uses `/` between segments.

### Resolver errors

If a resolver throws, the engine logs the error with `console.error` and denies the request with `reason: "resolver-error"`. Denials from other resolvers stop the search; only a missing match (`no-resolver-match`) continues.

### Gate Warden fallback

`createWithGw` falls back to Gate Warden only when no custom resolver matched:

```typescript
import { GateWarden } from "@wxn0brp/gate-warden";

const gw = new GateWarden(gwDb);
const engine = new PermissionResolverEngine();
engine.addResolver("password", async () => false, "endsWith");
const permValidFn = engine.createWithGw(gw);
```

### createGwValidFn

If you do not need custom resolvers, use Gate Warden directly:

```typescript
import { createGwValidFn } from "@wxn0brp/vql";
import { GateWarden } from "@wxn0brp/gate-warden";

const gw = new GateWarden(gwDb);
const permValidFn = createGwValidFn(gw);
```

`createGwValidFn` calls:

```typescript
gw.hasAccess(user._id ?? user.id, args.field, args.p);
```

Gate Warden loads the user from its own database. A user that does not exist there is reported as `user-404` and access is denied, even if the VQL context contains a valid user object. Register users and rules in the Gate Warden database, and hash paths with the same `hidePath` setting used by VQL.

## Complete example

```typescript
import VQLProcessor, { VQLConfig } from "@wxn0brp/vql";
import { PermissionResolverEngine } from "@wxn0brp/vql/permissions/resolver";
import { PermCRUD } from "@wxn0brp/vql/types/perm";

const engine = new PermissionResolverEngine();

// Never expose password hashes.
engine.addResolver("password", async () => false, "endsWith");

// Users can read all user fields except passwords.
// Only admins can update or delete.
engine.addResolver("main/users", async ({ p, user }) => {
    if (user?.role === "admin") return true;
    return (p & PermCRUD.READ) !== 0;
}, "startsWith");

const processor = new VQLProcessor(
    dbInstances,
    new VQLConfig({
        noCheckPermissions: false,
        strictSelect: true,
        strictACL: true
    }),
    engine.create()
);

const user = { _id: "user123", role: "user" };
const result = await processor.execute(
    `main users s._id=$_me e.name=1 e.email=1`,
    user
);
```

## LowAdapter bypass

`LowAdapter` resolvers run before the permission check. If you mount a `LowAdapter`, the permission layer is not applied. Do the authorization inside the resolver. See [Adapters](./adapters.md#lowadapter).

## Next steps

- [Configuration](./configuration.md)
- [Errors](./errors.md)
- [Relations](./relations.md)
