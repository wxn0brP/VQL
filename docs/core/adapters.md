# Adapters

VQL executes against ValtheraDB instances and adapter objects it recognizes. That opens four integration paths. `LowAdapter` is a special case: it is not a `ValtheraCompatible` implementation, and VQL detects it at runtime.

| Approach | Use when |
|----------|----------|
| Native ValtheraDB instance | The data lives in ValtheraDB |
| `LowAdapter` | You want full control over CRUD queries |
| `createValtheraAdapter` | Backing store is an API or a custom SDK |
| `AdapterBuilder` | You want per-operation, per-collection handlers |

Databases are registered by name:

```typescript
const processor = new VQLProcessor({
    main: valtheraDb,
    remote: apiAdapter,
    custom: lowAdapter
});
```

## LowAdapter

`LowAdapter` wraps a single resolver function and bypasses the CRUD executor:

```typescript
import { LowAdapter } from "@wxn0brp/vql/helpers/lowAdapter";

const custom = new LowAdapter(async (query, user) => {
    const [operation] = Object.keys(query.d);
    return {
        operation,
        collection: query.d[operation].collection,
        user
    };
});

const processor = new VQLProcessor({ custom });
```

`LowAdapter` has only a `resolver` field. TypeScript expects `ValtheraCompatible` values in the constructor, so cast the entry when strict type checking is enabled: `new VQLProcessor({ custom: custom as any })`.

The resolver receives the validated CRUD query and the user context.

```typescript
type LowResolver = (query: VQL_Query_CRUD, user: any) => Promise<any> | any;
```

Important properties:

- Queries are still parsed, validated, and have variables expanded.
- The permission layer is **not** applied. Authorize inside the resolver.
- Relations are not routed through `LowAdapter`. Use a full `ValtheraCompatible` implementation for relation queries.
- The resolver owns the result shape. VQL does not post-process it.

Use this for in-memory stores, proxies, or operations that do not map to a collection.

## createValtheraAdapter

`createValtheraAdapter` turns a set of resolver methods into a `ValtheraCompatible` object. The adapter covers the methods in the resolver interface below. Methods such as `createIndex`, `removeIndex`, and `capabilities` are not implemented and are missing at runtime.

```typescript
import { createValtheraAdapter } from "@wxn0brp/vql";

const apiAdapter = createValtheraAdapter({
    find: async query => {
        const res = await fetch(`/api/${query.collection}?q=` + encodeURIComponent(
            JSON.stringify(query.search)
        ));
        return await res.json();
    },
    findOne: async query => {
        const res = await fetch(`/api/${query.collection}/one?q=` + encodeURIComponent(
            JSON.stringify(query.search)
        ));
        const data = await res.json();
        return Array.isArray(data) ? (data[0] ?? null) : (data ?? null);
    },
    add: async query => {
        const res = await fetch(`/api/${query.collection}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(query.data)
        });
        return await res.json();
    },
    count: async query => {
        const rows = await apiAdapter.find(query);
        return rows.length;
    }
});
```

### Resolver interface

```typescript
interface ValtheraResolver {
    meta?: {
        type: "valthera" | "api" | "wrapper" | (string & {});
        version: string;
        description?: string;
        id?: string;
        displayName?: string;
        tags?: string[];
    };

    getCollections?: () => Promise<string[]>;
    issetCollection?: (collection: string) => Promise<boolean>;
    ensureCollection?: (collection: string) => Promise<boolean>;
    removeCollection?: (collection: string) => Promise<boolean>;

    add?: (query: VQueryT.Add) => Promise<Object>;
    find?: (query: VQueryT.Find) => Promise<Object[]>;
    findOne?: (query: VQueryT.FindOne) => Promise<Object | null>;

    update?: (query: VQueryT.Update) => Promise<Object[] | null>;
    updateOne?: (query: VQueryT.Update) => Promise<Object | null>;
    updateOneOrAdd?: (query: VQueryT.UpdateOneOrAdd) => Promise<UpdateOneOrAddResult>;
    toggleOne?: (query: VQueryT.ToggleOne) => Promise<ToggleOneResult>;

    count?: (query: VQueryT.Count) => Promise<number>;
    bulkAdd?: (query: VQueryT.BulkAdd) => Promise<Object[]>;

    remove?: (query: VQueryT.Remove) => Promise<Object | null>;
    removeOne?: (query: VQueryT.Remove) => Promise<Object | null>;
}
```

Missing methods are safe to omit. Calling one throws `VQLOperationError` with code `VQL_OPERATION_NOT_FOUND` and the message `Unknown operation "Unimplemented method"`. The literal operation name is used because the adapter calls the shared missing-method guard.

The adapter exposes `c(collection)` through a `Collection` wrapper, so VQL can call collection methods without knowing which operations are implemented.

### extendedFind

`createValtheraAdapter(resolver, extendedFind)` accepts a second argument:

```typescript
const adapter = createValtheraAdapter(resolver, true);
```

When `extendedFind` is `true`, the adapter handles a subset of find options on the client side:

- `dbFindOpts.reverse`
- `dbFindOpts.limit` (applied after reverse)
- `findOpts.select`, `findOpts.exclude`, `findOpts.transform`

Other options such as `offset`, `sortBy`, aggregation, and grouping must be handled by the resolver itself.

### Metadata

If `resolver.meta` is omitted, the adapter reports:

```typescript
{ type: "api", version: "0.0.1" }
```

Use `meta` for tooling and debugging:

```typescript
createValtheraAdapter({
    meta: {
        type: "api",
        version: "1.0.0",
        displayName: "Billing API",
        tags: ["billing"]
    },
    find: async query => { /* ... */ }
});
```

## AdapterBuilder

`AdapterBuilder` registers handlers per operation and collection:

```typescript
import { AdapterBuilder } from "@wxn0brp/vql/helpers/apiAbstract";

const api = new AdapterBuilder((error, op, arg) => {
    console.error(`Adapter error in ${op}`, error);
});

api.find("users", async query => {
    return await dbUsers.find(query.search);
});

api.findOne("users", async query => {
    return await dbUsers.findOne(query.search);
});

api.add("users", async query => {
    return await dbUsers.add(query.data);
});

// Wildcard fallback for every collection
api.find("*", async query => {
    return await remoteSearch(query.collection, query.search);
});

const adapter = api.getAdapter();
const processor = new VQLProcessor({ main: adapter });
```

### Methods

| Method | Operation |
|--------|-----------|
| `register(op, collection, fn)` | Generic registration |
| `add(collection, fn)` | `add` |
| `find(collection, fn)` | `find` |
| `findOne(collection, fn)` | `findOne` |
| `update(collection, fn)` | `update` |
| `updateOne(collection, fn)` | `updateOne` |
| `updateOneOrAdd(collection, fn)` | `updateOneOrAdd` |
| `toggleOne(collection, fn)` | `toggleOne` |
| `count(collection, fn)` | `count` |
| `bulkAdd(collection, fn)` | `bulkAdd` |
| `remove(collection, fn)` | `remove` |
| `removeOne(collection, fn)` | `removeOne` |
| `removeCollection(collection, fn)` | `removeCollection` |

`register` takes any CRUD operation name from the `Operation` union.

### Resolution order

For a request, the builder looks up:

1. `${operation}:${collection}`
2. `${operation}:*`
3. throws `VQLHandlerMissingError` if neither exists

If a handler throws, the builder calls the `catchCb` and resolves `undefined`. It does not rethrow. Make the callback log or rethrow deliberately if silent failures are not acceptable.

### Collection management

`getAdapter()` synthesizes:

- `getCollections()` from the set of collections passed to `register`.
- `issetCollection()` against that set.
- `ensureCollection()` by adding to that set.

`removeCollection` is not wired by the builder in the current implementation. Assign a handler directly on the returned adapter if you need it:

```typescript
const adapter = api.getAdapter();
adapter.removeCollection = async collection => {
    // remove the backing collection
    return true;
};
```

### extendedFind

`getAdapter(extendedFind = true)` passes the flag to `createValtheraAdapter`. Pass `false` if the backing API already applies `reverse`, `limit`, and selection:

```typescript
const adapter = api.getAdapter(false);
```

## Choosing an approach

- Use ValtheraDB directly when possible. It gives you the full option set, transactions, and indexes without extra work.
- Use `createValtheraAdapter` for a small, mostly read-only API.
- Use `AdapterBuilder` when different collections have different backends.
- Use `LowAdapter` only when you need to own the entire CRUD path and can handle permissions yourself.

## Next steps

- [Permissions](./permissions.md)
- [Errors](./errors.md)
