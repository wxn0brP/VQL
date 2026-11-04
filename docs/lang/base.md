# Language Overview

VQL provides two interchangeable query syntaxes that compile to the same internal representation and execute through the same code path.

| Syntax | Format | Best for |
|--------|--------|----------|
| [VQLS](./VQLS.md) | String | CLI tools, config files, quick scripts, logs |
| [VQLR](./VQLR.md) | Object | Application code, TypeScript, generated queries |

Both syntaxes accept the universal query wrapper:

```typescript
type VQLUQ<T = any> =
    | VQL_Query<T>
    | string
    | { query: string; var?: Record<string, any> };
```

`VQLProcessor.execute()` accepts any of these forms, plus a `user` context used by variables and permissions.

## Operations

| Operation | VQLS shorthand | VQLR key | Returns |
|-----------|----------------|----------|---------|
| find | `db collection` | `find` | `T[]` |
| findOne | `db collection!` | `findOne` or `f` | `T \| null` |
| add | `db +collection` | `add` | `T` |
| update | `db ~collection` | `update` | `T[]` |
| updateOne | `db ~collection!` | `updateOne` | `T \| null` |
| remove | `db -collection` | `remove` | `T[]` |
| removeOne | `db -collection!` | `removeOne` | `T \| null` |
| updateOneOrAdd | `db ?collection` | `updateOneOrAdd` | `{ data: T, type: "added" \| "updated" }` |
| toggleOne | `db ^collection` | `toggleOne` | `{ data: T, type: "added" \| "removed" }` |
| count | `db #collection` | `count` | `number` |
| bulkAdd | `db *collection` | `bulkAdd` | `T[]` |
| ensureCollection | `db ensureCollection name` | `ensureCollection` | `boolean` |
| issetCollection | `db issetCollection name` | `issetCollection` | `boolean` |
| removeCollection | `db removeCollection name` | `removeCollection` | `boolean` |
| getCollections | `db getCollections` | `getCollections` | `string[]` |

## Body prefixes

VQLS uses short prefixes for the body. VQLR uses the full property names.

| Prefix | VQLR property | Purpose |
|--------|---------------|---------|
| `s.` | `search` | Search/filter conditions |
| `d.` | `data` | Data payload for `add` and `toggleOne` |
| `u.` | `updater` | Update payload |
| `o.` | `options` | Database find options (limit, sort, offset) |
| `r.` | `relations` | Relation query, switches to relation mode |
| `e.` | `select` | Field selection |

For `update` and `remove`, a `d.` payload is automatically treated as `u.` when no `u.` value is present.

## Search operators

VQL passes search objects to ValtheraDB. Everything below is supported in VQLR. In VQLS, comparison operators have shorthand syntax and all other operators are written with their `$` name (see [VQLS](./VQLS.md#operators)).

| Operator | Meaning | Example |
|----------|---------|---------|
| equality | Field equals value | `{ status: "active" }` |
| `$ne` | Not equal | `{ $ne: { status: "deleted" } }` |
| `$gt` | Greater than | `{ $gt: { age: 18 } }` |
| `$lt` | Less than | `{ $lt: { price: 100 } }` |
| `$gte` | Greater or equal | `{ $gte: { age: 18 } }` |
| `$lte` | Less or equal | `{ $lte: { price: 100 } }` |
| `$between` | Inclusive range | `{ $between: { age: [18, 65] } }` |
| `$in` | Value in array | `{ $in: { role: ["admin", "mod"] } }` |
| `$nin` | Value not in array | `{ $nin: { status: ["banned"] } }` |
| `$exists` | Field presence | `{ $exists: { email: true } }` |
| `$type` | JavaScript type name | `{ $type: { age: "number" } }` |
| `$and` | All conditions match | `{ $and: [{ status: "a" }, { age: { $gt: 18 } }] }` |
| `$or` | Any condition matches | `{ $or: [{ role: "admin" }, { ownerId: "u1" }] }` |
| `$not` | Negate a condition | `{ $not: { status: "deleted" } }` |
| `$regex` | Regular expression | `{ $regex: { name: /^A/i } }` |
| `$startsWith` | String prefix | `{ $startsWith: { name: "Al" } }` |
| `$endsWith` | String suffix | `{ $endsWith: { email: "@x.com" } }` |
| `$iStartsWith` | Case-insensitive prefix | `{ $iStartsWith: { name: "al" } }` |
| `$iEndsWith` | Case-insensitive suffix | `{ $iEndsWith: { email: "@X.COM" } }` |
| `$arrInc` | Array includes value | `{ $arrInc: { tags: ["new"] } }` |
| `$arrIncAll` | Array includes all values | `{ $arrIncAll: { tags: ["a", "b"] } }` |
| `$size` | Array length | `{ $size: { tags: 3 } }` |
| `$subset` | Literal `$` keys in data | `{ $subset: { "$ref": "x" } }` |

Nested fields can be targeted by nesting the operator:

```typescript
{ $gt: { profile: { age: 18 } } }
```

Plain nested objects are also valid equality conditions:

```typescript
{ profile: { city: "NYC" } }
```

## Updater operators

| Operator | Meaning |
|----------|---------|
| `$set` | Set fields (same as plain assignment) |
| `$unset` | Remove fields |
| `$rename` | Rename a field |
| `$inc` | Increment a number |
| `$dec` | Decrement a number |
| `$push` | Append to an array |
| `$pushSet` | Append values that are not already present |
| `$pushAll` | Append all values |
| `$pull` | Remove matching values |
| `$pullAll` | Remove all matching values |
| `$merge` | Shallow merge an object |
| `$deepMerge` | Deep merge an object |

```typescript
{
    updater: {
        name: "Bob",
        $inc: { loginCount: 1 },
        $set: { profile: { lastLogin: { __: "_now" } } }
    }
}
```

Updater keys are not split on dots. Use nested objects for a nested update. In VQLS, `u.$set.profile.lastLogin=...` works because the parser builds the nesting.

## Field selection

`select` accepts either an array of field paths or a record of field flags.

```typescript
select: { name: 1, email: 1, internal: 0 }
select: ["name", "email", "profile.city"]
```

Rules:

- An omitted or empty selection means "no selection", so the full record is returned.
- Arrays support dotted paths such as `profile.city`.
- Records keep fields whose value is truthy.
- For CRUD operations in VQLS, `e.` paths are collapsed to their top-level field. Use VQLR when you need a nested path for CRUD.
- Relation queries keep nested paths only as segment arrays such as `[["profile", "city"]]`. Dotted strings and record selectors are not converted for relations.
- For array relations (`1n`, `nm`), select the relation key as a whole. Field picking does not traverse arrays.
- With permissions enabled, returned objects are filtered per field. See [Permissions](../core/permissions.md).

## Variables

Variables are resolved after the top-level shape check and before the detailed validation and execution.

### Predefined variables

| Variable | Value |
|----------|-------|
| `_me` | `user.id \|\| user._id \|\| user` |
| `_user` | Full user object |
| `_now` | `Date.now()` in milliseconds |
| `_nowShort` | `Date.now() / 1000` rounded down |
| `__now` | `Date.now().toString()` |
| `__nowShort` | Seconds as a string |

Predefined names cannot be overridden by the `var` object.

### Custom variables

In VQLS, a value starting with `$` references a variable:

```text
db users s.role=$role u.lastSeen=$_now
```

In VQLR, use the reference object:

```typescript
{
    db: "main",
    d: { add: { collection: "users", data: { ownerId: { __: "_me" }, createdAt: { __: "_now" } } } },
    var: { role: "admin" }
}
```

Pass variables alongside a string query:

```typescript
await processor.execute({
    query: "main users s.role=$role",
    var: { role: "admin" }
});
```

Unresolved variables are left untouched. Objects that contain `__` but do not match a known variable also stay unchanged.

## TypeScript types

The main types live in `src/types/vql.ts` and are published under the `types/vql` subpath:

```typescript
import type {
    VQLUQ,
    VQL_Query,
    VQL_Query_CRUD,
    VQL_Query_Relation,
    VQL_OP_Find,
    VQL_OP_FindOne,
    VQL_OP_Add,
    VQL_OP_Update,
    VQL_OP_Remove,
    VQL_OP_UpdateOneOrAdd,
    VQL_OP_ToggleOne,
    VQL_OP_Count,
    VQL_OP_BulkAdd,
    VQL_Fields,
    VQL_Var
} from "@wxn0brp/vql/types/vql";
```

Permission types live in `@wxn0brp/vql/types/perm` and `@wxn0brp/vql/types/resolver`.

## Next steps

- [VQLS syntax](./VQLS.md)
- [VQLR structure](./VQLR.md)
- [Relations](../core/relations.md)
- [Permissions](../core/permissions.md)
