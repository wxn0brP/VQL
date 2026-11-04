# Configuration

`VQLConfig` controls validation, visibility, and permission behavior. Every value has a default, so a processor can be created without a config object.

```typescript
import VQLProcessor, { VQLConfig } from "@wxn0brp/vql";

const processor = new VQLProcessor(dbInstances, new VQLConfig({
    noCheckPermissions: false,
    strictSelect: true,
    strictACL: true
}));
```

The constructor also accepts a plain object:

```typescript
const processor = new VQLProcessor(dbInstances, {
    noCheckPermissions: false,
    strictSelect: true
});
```

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `noCheckPermissions` | `true` | Disables the permission layer entirely |
| `strictSelect` | `false` | Required to be `true` when permissions are enabled |
| `strictACL` | `false` | Disables fallback from a missing entity to its parent path |
| `hidePath` | `false` | Hashes permission paths before passing them to `permValidFn` |
| `permissionDeniedIfNoUser` | `true` | Denies requests when the user context is falsy |
| `allowEmptyAdd` | `true` | Allows `add` without a data payload |

### noCheckPermissions

The permission layer is off by default. When set to `false`, every operation is checked by `permValidFn` before execution, and returned records are filtered per field. `LowAdapter` databases are an exception: their resolver runs before the permission layer, so authorize inside the resolver. See [Permissions](./permissions.md).

### strictSelect

When permissions are enabled, `strictSelect` must be `true`. Constructing the config with `noCheckPermissions: false` and `strictSelect: false` throws `VQLConfigError`:

```text
strictSelect must be true when permissions are enabled (noCheckPermissions: false).
Without strictSelect, nested fields without READ permission can be leaked.
```

The flag makes selection intent explicit. Field redaction itself is performed by the permission filter. For CRUD, an empty or omitted selection still returns full records. For relation queries, an empty selection becomes `[]` when `strictSelect` is `true`, which removes every field from the result.

### strictACL

Permission results can report `reason: "entity-404"`, which means the path is not known to the permission backend.

- `strictACL: false` (default): VQL retries the parent path, walking up from field to collection. The database-level retry applies to field paths only; collection operations such as `add` and `remove` have no parent fallback.
- `strictACL: true`: the denial is final. No parent lookup is performed.

Use `true` when every path is registered explicitly and a missing entry should always mean "deny".

### hidePath

When `true`, the `field` passed to `permValidFn` is the SHA-256 hash of the JSON path instead of the JSON string itself:

```typescript
// hidePath: false
field = '["main","users","email"]';

// hidePath: true
field = "a3f1...";  // sha256 of the JSON above
```

The original path is still available in `args.path`. Hashing keeps storage keys opaque but requires the permission backend to be populated with hashed keys.

Hashing works in Node.js and in browsers with WebCrypto.

### permissionDeniedIfNoUser

When `true`, a falsy user context causes an immediate denial. Only `null` triggers the denial in practice: `execute()` replaces `undefined` with the placeholder `{ _id: "null-null-null" }`, so `undefined` continues with a fake identity. `FF_VQL` defaults the context to `{}` unless `getUser` is provided, and `{}` is truthy.

Pass an explicit user object in real applications. Return `null` from `getUser` to deny anonymous requests.

### allowEmptyAdd

When `true` (default), `add` may omit `data` or use `{}`. When `false`, the validator requires a non-empty object:

```typescript
new VQLConfig({ allowEmptyAdd: false });
```

## Presets

**Development**

```typescript
new VQLConfig({
    noCheckPermissions: true,
    strictSelect: false,
    strictACL: false,
    hidePath: false
});
```

**Permission-aware**

```typescript
new VQLConfig({
    noCheckPermissions: false,
    strictSelect: true,
    strictACL: true,
    hidePath: false,
    permissionDeniedIfNoUser: true
});
```

**Opaque paths**

```typescript
new VQLConfig({
    noCheckPermissions: false,
    strictSelect: true,
    strictACL: true,
    hidePath: true
});
```

## Per-query override

`execute()` accepts a third argument that overrides the processor config for a single query:

```typescript
await processor.execute(query, user, new VQLConfig({
    noCheckPermissions: false,
    strictSelect: true
}));
```

The override is used as-is. Validation happens only in the `VQLConfig` constructor, so construct the config before passing it. A `VQLConfig` with permissions enabled and `strictSelect: false` throws before `execute()` is called. A plain object passed in this position is not validated.

## Errors

An invalid config produces a `VQLConfigError` with code `VQL_CONFIG_INVALID` and status code `500`. See [Errors](./errors.md).

## Next steps

- [Permissions](./permissions.md)
