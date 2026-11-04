# VQLS (String Syntax)

VQLS is a compact, line-oriented syntax for VQL. It is intended for CLI tools, configuration, logs, and places where embedding JSON is inconvenient.

## Grammar

```text
<database> <operation> <collection> [body...]
<database> <collection-with-shorthand> [body...]
```

The body is a sequence of `key=value` tokens. Whitespace is flexible around `=`. A comparison operator such as `>` must follow the field name directly, without a space. Newlines are merged into one query, so a query may span several lines.

```text
db users
s.status="active"
s.age>18
e.name=1
```

The same query on one line:

```text
db users s.status="active" s.age>18 e.name=1
```

## Shorthands

| Form | Operation | Example |
|------|-----------|---------|
| *none* | find | `db users` |
| `!` suffix | findOne | `db users!` |
| `+` prefix | add | `db +users` |
| `~` prefix | update | `db ~users` |
| `~` prefix + `!` suffix | updateOne | `db ~users!` |
| `-` prefix | remove | `db -users` |
| `-` prefix + `!` suffix | removeOne | `db -users!` |
| `?` prefix | updateOneOrAdd | `db ?users` |
| `^` prefix | toggleOne | `db ^users` |
| `#` prefix | count | `db #users` |
| `*` prefix | bulkAdd | `db *users` |

A `!` suffix on `add` is ignored, so `db +users!` is still an add.

## Explicit operations

```text
db find users s.status="active"
db findOne users s._id="123"
db add users d.name="Alice"
db update users s.role="guest" u.role="user"
db updateOne users s._id="123" u.name="Bob"
db remove users s.active=false
db removeOne users s._id="123"
db updateOneOrAdd users s._id="123" u.name="Bob"
db toggleOne users s._id="123"
db count users s.status="active"
db bulkAdd users datas=[{"name":"Alice"},{"name":"Bob"}]
db ensureCollection logs
db issetCollection logs
db removeCollection temp_data
db getCollections
```

Use the explicit form when the collection name could be confused with an operation. Do not append `!` to a collection passed to an explicit operation. The suffix is only parsed in shorthand form.

## Body aliases

| Prefix | Property | Used by |
|--------|----------|---------|
| `s.` | `search` | find, findOne, update, updateOne, updateOneOrAdd, remove, removeOne, toggleOne, count, relation. Required for `updateOneOrAdd` and `toggleOne` |
| `d.` | `data` | add, toggleOne |
| `u.` | `updater` | update, updateOne, updateOneOrAdd |
| `o.` | `options` | find, relation |
| `r.` | `relations` | relation query |
| `e.` | `select` | all operations that return records |

Dots also create nested objects:

```text
db users s.address.city="NYC"
```

This produces:

```typescript
{ db: "db", d: { find: { collection: "users", search: { address: { city: "NYC" } } } } }
```

Numeric path segments create arrays, which is useful for logical operators:

```text
db users s.$and.0.status="active" s.$and.1.role="admin"
```

Comparison operators are rewritten to the operator-first form, so do not mix them with a nested `$and` path. Use the JSON form instead:

```text
db users s={"$and":[{"status":"active"},{"age":{"$gt":18}}]}
```

## Values

| Type | Syntax | Example |
|------|--------|---------|
| String | `"value"`, `'value'`, `` `value` `` | `s.name="Alice"` |
| Number | Numeric literal | `s.age=25` |
| Boolean | `true` / `false` | `s.active=true` |
| JSON array | `[...]` | `s.tags=["a","b"]` |
| JSON object | `{...}` | `s={"$or":[{"a":1},{"b":2}]}` |
| Variable | `$name` | `s.role=$role` |
| Anything else | Unquoted string | `s.name=Alice` |

JSON values must be compact. Spaces, `=`, `<`, and `>` are treated as token separators even inside a `{...}` value, so `s={"a": 1}` is parsed incorrectly. Write `s={"a":1}` instead, or move the condition to a quoted string.

Quoted strings may contain spaces, `=`, `<`, and `>`. A backslash escapes the next character, for example `"He said \"hi\""`.

Numbers are parsed as numbers. Quote identifiers to keep them as strings:

```text
db users s.externalId="12345"
```

`null` cannot be written as a bare literal because it is parsed as the string `"null"`. Use a JSON object for the whole search object when you need `null`:

```text
db users s={"deletedAt":null}
```

An empty value at the end of a query becomes `true`:

```text
db users s.active=
```

Prefer the explicit form (`s.active=true`) to avoid ambiguity when more tokens follow.

## Operators

Comparison operators are written between the field and the value:

| Syntax | VQLR equivalent |
|--------|-----------------|
| `s.age=25` | `{ age: 25 }` |
| `s.age>18` | `{ $gt: { age: 18 } }` |
| `s.age>=18` | `{ $gte: { age: 18 } }` |
| `s.age<65` | `{ $lt: { age: 65 } }` |
| `s.age<=65` | `{ $lte: { age: 65 } }` |

Other operators use their `$` name directly as part of the key:

```text
db users s.$ne.status="deleted"
db users s.$in.role=["admin","mod"]
db users s.$between.age=[18,65]
db users s.$exists.email=true
db users s.$startsWith.name="Al"
db users s.$arrInc.tags=["new"]
```

For complex logical conditions, either use numeric path segments or assign a JSON object:

```text
db users s.$or.0.role="admin" s.$or.1.ownerId=$_me
db users s={"$and":[{"status":"active"},{"age":{"$gt":18}}]}
```

Regular expressions cannot be expressed as `RegExp` instances in VQLS. Raw pattern strings are accepted by ValtheraDB but deprecated, so prefer VQLR when you need `/pattern/` semantics.

Updater operators use the same `$` notation:

```text
db ~users s._id="123" u.$inc.loginCount=1 u.$set.lastSeen=$_now
```

## Field selection

```text
db users s.status="active" e.name=1 e.email=1
```

For CRUD operations, VQLS converts `e.` keys into a top-level field list: `e.profile.city=1` selects the whole `profile` object. Use VQLR if you need a nested selection path for CRUD.

Relation queries keep nested paths, but only when the query runs in relation mode. Add an `r.` key:

```text
db orders e._id=1 e.customer.name=1
r.customer.path=["main","users"]
many=true
```

Without `r.`, `e.orders.total=1` is a CRUD query and the select collapses to the top-level `orders` field.

## Options

`o.` maps to database find options:

```text
db users o.limit=10 o.offset=20 o.sortBy=name o.sortAsc=false
```

Use `o.limit`, not a top-level `limit` property. See [VQLR](./VQLR.md#find) for the full option list.

## Relations

A query becomes a relation query when the body contains an `r.` key.

```text
db users s.status="active" e.name=1 e.orders.total=1
r.orders.path=["shop","orders"]
r.orders.select=["total","status"]
many=true
```

Per-relation `search` (for example `r.orders.search.status="pending"`) is accepted by the validator but is not applied when the relation is loaded. Filter the parent query with `s.` or `r.search` instead, or query the related collection separately.

Each relation entry is keyed by the output field name. `path` is `[database, collection]`. When `path` is omitted, it defaults to `[current-db, relation-name]`. The `db` and `c` keys are shorthand for the same values:

```text
db users r.orders.db="shop" r.orders.c="orders"
```

Nested relations use the same dotted structure:

```text
db users r.orders.path=["shop","orders"] r.orders.relations.items.path=["shop","items"]
```

`r.x.select` must be a JSON array. A dotted object such as `r.orders.select.name=1` fails validation because relation selects are arrays.

Top-level relation options do not use the `r.` prefix:

```text
many=true
options.limit=10
```

`r.` always creates a relation entry, so `r.many=true` would define a relation named `many` instead of setting the root option.

See [Relations](../core/relations.md) for `pk`, `fk`, `type`, `through`, and nested select semantics.

## Collection operations

```text
db ensureCollection logs
db issetCollection logs
db removeCollection logs
db getCollections
```

`getCollections` is a special two-token query and takes no collection argument.

## Comments

Lines whose first non-space characters are `#` or `//` are ignored. Trailing comments on the same line are not supported.

```text
# Active users
db users s.status="active"
// Only the first page
o.limit=10
```

## Examples

```text
# Find with filter and selection
db users s.status="active" s.age>18 e.name=1 e.email=1 o.limit=10

# Add a record
db +users d.name="Alice" d.email="alice@example.com" d.age=30

# Update one record and return selected fields
db ~users! s._id="123" u.name="Bob" u.updatedAt=$_now e.name=1 e.updatedAt=1

# Update many records
db ~users s.role="guest" u.role="user" e._id=1 e.name=1

# Upsert
db ?users s._id="123" u.name="Bob" u.lastSeen=$_now e.name=1

# Delete with selected return fields
db -users s.active=false e._id=1 e.name=1
db -users! s._id="123" e.name=1

# Toggle
db ^users s._id="123" e._id=1

# Count
db #users s.status="active"

# Bulk insert
db *users datas=[{"name":"Alice"},{"name":"Bob"}]

# Relation query
db users s.status="active"
r.orders.path=["shop","orders"]
r.orders.select=["total","status"]
many=true
e.name=1 e.orders.total=1

# Collection management
db ensureCollection logs
db getCollections
```

## Gotchas

- Explicit operations do not strip the `!` suffix from the collection name.
- Bare `null`, `undefined`, and functions are not supported. Use JSON for `null`.
- Duplicate keys overwrite earlier values.
- A comparison operator always applies to the whole dotted path after the alias: `s.a.b>1` becomes `{ $gt: { a: { b: 1 } } }`.
- An empty value consumes the next token as its value. Keep `key=` at the end of the body or use an explicit value.
- `e.` collapses nested paths for CRUD operations. Use VQLR for nested CRUD selects.
- `r.x.search` is validated but ignored by the relation loader. Use `s.` or `r.search` on the parent query.
- JSON values must be compact: `s={"a":1}` works, `s={"a": 1}` does not.
- With an explicit operation and no body, a dotted collection name is misparsed: `db find my.col` treats `find` as the collection. Add a body token or use the shorthand `db my.col`.
- The parser has no implicit type conversion beyond numbers, booleans, and JSON.
- `r.many=true` is parsed as a relation named `many`. Use `many=true` for the root relation option.

## Next steps

- [VQLR structure](./VQLR.md)
- [Relations](../core/relations.md)
- [Troubleshooting](../guide/troubleshooting.md)
