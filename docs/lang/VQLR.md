# VQLR (Object Syntax)

VQLR is the object form of VQL. It is the internal representation produced by the VQLS parser and the preferred format for application code and generated queries.

## Query shapes

```typescript
import type { VQL_Query, VQL_Query_CRUD, VQL_Query_Relation, VQL_Var } from "@wxn0brp/vql/types/vql";

interface VQL_Query_CRUD {
    db: string;
    d: VQL_Query_CRUD_Data;
}

interface VQL_Query_Relation {
    r: {
        path: [string, string];
        search: Record<string, any>;
        relations: Record<string, RelationConfig>;
        many?: boolean;
        options?: DbFindOpts;
        select?: string[][] | Record<string, any>;
    };
}

type VQL_Query = (VQL_Query_CRUD | VQL_Query_Relation) & VQL_Var;
```

A query must contain `db` + `d`, or `r`. `var` is optional and is removed after variable expansion. If both shapes are present, `r` wins and the CRUD part is ignored.

## CRUD operations

### find

```typescript
interface VQL_OP_Find<T = any> {
    collection: string;
    search?: Search<T>;
    limit?: number;
    select?: VQL_Fields;
    options?: DbFindOpts<T>;
    searchOpts?: FindOpts<T>;
}
```

```typescript
{
    db: "main",
    d: {
        find: {
            collection: "users",
            search: { status: "active" },
            select: { name: 1, email: 1 },
            options: { limit: 10, sortBy: "name" },
            searchOpts: { exclude: ["internalNotes"] }
        }
    }
}
```

`options` is passed to the database as `DbFindOpts`. `searchOpts` is applied to the returned records and supports `select`, `exclude`, and `transform`.

A top-level `select` is merged into `searchOpts.select` and takes precedence. Use `options.limit` for limiting, not the top-level `limit` property. The `limit` field exists in the type for historical compatibility but the CRUD executor does not read it.

When combining `select` with `sortBy`, include the sort field in the selection. Selection is applied while records are processed, so selecting the field away can make the sort ineffective.

### findOne / f

```typescript
interface VQL_OP_FindOne<T = any> {
    collection: string;
    search: Search<T>;
    select?: VQL_Fields;
    searchOpts?: FindOpts<T>;
}
```

```typescript
{ db: "main", d: { findOne: { collection: "users", search: { _id: "123" } } } }
{ db: "main", d: { f: { collection: "users", search: { _id: "123" } } } }
```

`search` is required and must be an object. An empty object is valid.

### add

```typescript
interface VQL_OP_Add<T = any> {
    collection: string;
    data?: Arg<T>;
    id_gen?: boolean;
}
```

```typescript
{ db: "main", d: { add: { collection: "users", data: { name: "Alice", age: 30 } } } }
```

`id_gen` defaults to `true`. When `VQLConfig.allowEmptyAdd` is `true` (the default), `data` may be omitted or empty. Set `allowEmptyAdd: false` to require a non-empty data object.

### update / updateOne

```typescript
interface VQL_OP_Update<T = any> {
    collection: string;
    search: Search<T>;
    updater: UpdaterArg<T>;
    select?: VQL_Fields;
}
```

```typescript
{
    db: "main",
    d: {
        update: {
            collection: "users",
            search: { role: "guest" },
            updater: { role: "user" },
            select: ["name"]
        }
    }
}

{
    db: "main",
    d: {
        updateOne: {
            collection: "users",
            search: { _id: "123" },
            updater: { name: "Bob", $inc: { loginCount: 1 } }
        }
    }
}
```

`search` and `updater` are required. Both `update` and `updateOne` operate on the matched records; `updateOne` affects at most one.

### remove / removeOne

```typescript
interface VQL_OP_Remove<T = any> {
    collection: string;
    search: Search<T>;
    select?: VQL_Fields;
}
```

```typescript
{ db: "main", d: { remove: { collection: "users", search: { active: false } } } }
{ db: "main", d: { removeOne: { collection: "users", search: { _id: "123" }, select: { name: 1 } } } }
```

Both operations return the removed records, filtered by `select` when provided.

### updateOneOrAdd

```typescript
interface VQL_OP_UpdateOneOrAdd<T = any> {
    collection: string;
    search: Search<T>;
    updater: UpdaterArg<T>;
    add_arg?: Arg<T>;
    id_gen?: boolean;
    select?: VQL_Fields;
}
```

```typescript
{
    db: "main",
    d: {
        updateOneOrAdd: {
            collection: "users",
            search: { _id: "123" },
            updater: { name: "Bob" },
            add_arg: { name: "Bob", email: "b@x.com" }
        }
    }
}
```

Returns `{ data, type }`, where `type` is `"added"` or `"updated"`. When `add_arg` is omitted, the insert payload is derived from the search and updater.

### toggleOne

```typescript
interface VQL_OP_ToggleOne<T = any> {
    collection: string;
    search: Search<T>;
    data?: Arg<T>;
    select?: VQL_Fields;
}
```

```typescript
{
    db: "main",
    d: {
        toggleOne: {
            collection: "favorites",
            search: { userId: "123", itemId: "456" },
            select: ["_id"]
        }
    }
}
```

Returns `{ data, type }`, where `type` is `"added"` or `"removed"`.

### count

```typescript
interface VQL_OP_Count<T = any> {
    collection: string;
    search?: Search<T>;
}
```

```typescript
{ db: "main", d: { count: { collection: "users", search: { status: "active" } } } }
```

### bulkAdd

```typescript
interface VQL_OP_BulkAdd<T = any> {
    collection: string;
    datas: Arg<T>[];
    id_gen?: boolean;
}
```

```typescript
{ db: "main", d: { bulkAdd: { collection: "users", datas: [{ name: "Alice" }, { name: "Bob" }] } } }
```

## Collection management

```typescript
{ db: "main", d: { ensureCollection: { collection: "logs" } } }
{ db: "main", d: { issetCollection: { collection: "logs" } } }
{ db: "main", d: { removeCollection: { collection: "temp" } } }
{ db: "main", d: { getCollections: {} } }
```

Collection operations return booleans, except `getCollections`, which returns `string[]`.

## Relational queries

```typescript
{
    r: {
        path: ["main", "orders"],
        search: { status: "pending" },
        many: true,
        relations: {
            customer: {
                path: ["main", "users"],
                pk: "customerId",
                fk: "_id",
                select: ["name", "email"]
            },
            items: {
                path: ["inventory", "products"],
                type: "1n",
                pk: "_id",
                fk: "orderId"
            }
        },
        select: [["_id"], ["customer", "name"], ["items"]]
    }
}
```

`path`, `search`, and `relations` are required. `search` and `relations` may be empty objects, but they must be present. `many` defaults to `false`, which performs a `findOne`. `options` accepts `DbFindOpts`.

`select` must be an array of segment arrays such as `[["_id"], ["customer", "name"]]`. Nested relation output uses the relation key: `["customer", "name"]` selects the `name` field of the joined `customer` object. An object selector passes validation but is flattened to top-level keys and then fails at runtime, so use segment arrays for relations.

See [Relations](../core/relations.md) for all relation options.

## Field selection

```typescript
select: { name: 1, email: 1 }
select: ["name", "email"]
select: ["profile.city", "settings.theme"]
```

Rules:

- An omitted or empty selection means no filtering for CRUD. An empty relation selection also means no filtering without `strictSelect`, but selects no fields when `strictSelect` is `true`.
- Arrays support dotted paths and `["a", "b"]` segments for CRUD.
- Records select fields with truthy values for CRUD; record selectors are not converted for relation queries.
- Relation queries take segment arrays only. Dotted strings are not converted.
- Permission checks add their own field-level filtering after execution.

## Options

`options` (`DbFindOpts`):

| Option | Type | Description |
|--------|------|-------------|
| `reverse` | `boolean` | Reverse the result order |
| `limit` | `number` | Maximum number of records |
| `offset` | `number` | Skip records |
| `sortBy` | `string \| { field, asc }[]` | Sort field(s) |
| `sortAsc` | `boolean` | Sort direction for `sortBy` |
| `min` | `Record<string, string>` | Minimum aggregation per field |
| `max` | `Record<string, string>` | Maximum aggregation per field |
| `avg` | `Record<string, string>` | Average aggregation per field |
| `sum` | `Record<string, string>` | Sum aggregation per field |
| `distinct` | `string` | Distinct values of a field |
| `groupBy` | `string \| string[]` | Group records |
| `count` | `Record<string, string>` | Count aggregation |

`searchOpts` (`FindOpts`):

| Option | Type | Description |
|--------|------|-------------|
| `select` | `FieldPath[]` | Fields to keep |
| `exclude` | `FieldPath[]` | Fields to remove |
| `transform` | `Function` | Transform the record before other options |

## Variables

Use `{ __: "name" }` anywhere a value is expected. Strings starting with `$` are also replaced by the variable value.

```typescript
{
    db: "main",
    d: {
        add: {
            collection: "users",
            data: {
                ownerId: { __: "_me" },
                createdAt: { __: "_now" }
            }
        }
    },
    var: { role: "admin" }
}
```

Reserved names (`_me`, `_user`, `_now`, `_nowShort`, `__now`, `__nowShort`) cannot be overridden. See [Language Overview](./base.md#variables).

## Response shapes

| Operation | Result |
|-----------|--------|
| `find` | `T[]` |
| `findOne` / `f` | `T \| null` |
| `add` | `T` |
| `update` | `T[]` |
| `updateOne` | `T \| null` |
| `remove` | `T[]` |
| `removeOne` | `T \| null` |
| `updateOneOrAdd` | `{ data: T, type: "added" \| "updated" }` |
| `toggleOne` | `{ data: T, type: "added" \| "removed" }` |
| `count` | `number` |
| `bulkAdd` | `T[]` |
| `ensureCollection` | `boolean` |
| `issetCollection` | `boolean` |
| `removeCollection` | `boolean` |
| `getCollections` | `string[]` |

`VQLProcessor.execute()` returns `T | VQLError`. Always check the result for errors.

## Complete example

```typescript
import VQLProcessor from "@wxn0brp/vql";
import type { VQLUQ } from "@wxn0brp/vql/types/vql";

const query: VQLUQ = {
    db: "main",
    d: {
        find: {
            collection: "users",
            search: {
                $and: [
                    { status: "active" },
                    { $gte: { age: 18 } }
                ]
            },
            options: { limit: 50, sortBy: [{ field: "age", asc: true }] },
            select: ["name", "email", "age", "profile.city"]
        }
    }
};

const result = await processor.execute(query);
if (result instanceof Error) {
    console.error(result.message);
} else {
    console.log(result);
}
```

## TypeScript types

```typescript
import type {
    VQLUQ, VQL_Query, VQL_Query_CRUD, VQL_Query_Relation, VQL_Var,
    VQL_OP_Find, VQL_OP_FindOne, VQL_OP_Add, VQL_OP_Update,
    VQL_OP_Remove, VQL_OP_UpdateOneOrAdd, VQL_OP_ToggleOne,
    VQL_OP_Count, VQL_OP_BulkAdd, VQL_Fields
} from "@wxn0brp/vql/types/vql";
```

## Next steps

- [VQLS syntax](./VQLS.md)
- [Relations](../core/relations.md)
- [Configuration](../core/configuration.md)
