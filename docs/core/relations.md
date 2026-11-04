# Relations

Relations let one query join records across collections and databases. VQL passes the relation description to ValtheraDB, which loads the related records and attaches them to each parent record under the relation key.

## Shape

A relation query has no `db` + `d` pair. It uses the `r` key directly:

```typescript
{
    r: {
        path: ["orders_db", "orders"],
        search: { status: "pending" },
        relations: {
            customer: {
                path: ["users_db", "users"],
                pk: "customerId",
                fk: "_id",
                select: ["name", "email"]
            }
        },
        many: true,
        select: [["_id"], ["customer", "name"]]
    }
}
```

`path` is `[database, collection]` and must reference a database registered with the processor. `search` and `relations` are required objects. They may be empty, but they must be present.

## Relation options

Each entry in `relations` is keyed by the output field name and accepts:

| Option | Default | Description |
|--------|---------|-------------|
| `path` | required | `[database, collection]` of the related records |
| `pk` | `_id` | Field on the parent record used for the join |
| `fk` | `_id` | Field on the related record used for the join |
| `type` | `"1"` | Relation type: `1`, `11`, `1n`, `nm`, `n1` |
| `as` | relation key | Field name used for the joined output |
| `select` | all fields | Fields to keep on the related record |
| `dbFindOpts` | `{}` | Database find options for the related query |
| `relations` | none | Nested relations on the related record |
| `through` | none | Pivot table description for `nm` |

### Select

`select` is an array of field names on the related record. The join field is added automatically and removed from the result unless it was selected explicitly.

```typescript
customer: {
    path: ["users_db", "users"],
    pk: "customerId",
    fk: "_id",
    select: ["name", "email"]
}
```

### Types

| Type | Meaning | Output |
|------|---------|--------|
| `1` | Parent `pk` matches one related `fk` | Object or `null` |
| `11` | Same as `1`, looked up per parent with `findOne` | Object or `null` |
| `1n` | Many related records share the parent `pk` | Array |
| `nm` | Many-to-many through a pivot collection | Array |
| `n1` | Parent `pk` is an array of ids, first match wins | Object or `null` |

```typescript
// Order belongs to one customer: orders.customerId -> users._id
customer: {
    path: ["main", "users"],
    type: "1",
    pk: "customerId",
    fk: "_id"
}

// Order has many items: items.orderId -> orders._id
items: {
    path: ["main", "items"],
    type: "1n",
    pk: "_id",
    fk: "orderId"
}
```

### Many-to-many

`type: "nm"` requires `through`:

```typescript
{
    path: ["main", "tags"],
    type: "nm",
    pk: "_id",
    fk: "_id",
    through: {
        table: "post_tags",
        db: "main",       // optional, defaults to the related collection's database
        pk: "postId",     // parent id stored in the pivot
        fk: "tagId"       // related id stored in the pivot
    }
}
```

The pivot collection is queried for rows whose `through.pk` matches the parent `pk`. The `through.fk` values are then resolved against the related collection using `fk`.

### Nested relations

```typescript
{
    r: {
        path: ["main", "orders"],
        search: {},
        relations: {
            customer: {
                path: ["main", "users"],
                pk: "customerId",
                relations: {
                    company: {
                        path: ["main", "companies"],
                        pk: "companyId",
                        fk: "_id"
                    }
                }
            }
        }
    }
}
```

Nested relation output is attached to the related record. Top-level `select` paths address it through the relation key: `["customer", "company", "name"]`.

### Multi-database

Every `path` selects its own database. `through.db` selects the database for a pivot collection and defaults to the database in the relation `path`. Only the databases in `path` are checked before execution. An unregistered `through.db` fails later during the pivot lookup instead of raising `VQLDBNotFoundError`.

## Top-level query options

| Option | Description |
|--------|-------------|
| `many` | `true` runs `find`, `false` (default) runs `findOne` |
| `options` | `DbFindOpts` for the parent query |
| `select` | Field paths to keep, as an array of segment arrays (`string[][]`) |

`select` accepts nested paths for joined objects:

```typescript
select: [["_id"], ["customer", "name"], ["items"]]
```

For array relations such as `1n` and `nm`, select the relation key as a whole. Field picking does not traverse arrays, so `["items", "price"]` would produce undefined fields instead of filtering each item.

Top-level relation `select` must use segment arrays, as shown above. The validator also accepts an object, but the relation engine does not convert it in VQLR: the object is flattened to top-level keys and the lookup throws `VQLInternalError`. Build the query in VQLS, where `e.` is converted before execution.

## VQLS syntax

In VQLS, a relation query starts when the body contains an `r.` key. The relation path defaults to `[current database, relation name]`:

```text
db orders s.status="pending"
r.customer.path=["users_db","users"]
r.customer.pk="customerId"
r.customer.fk="_id"
r.customer.select=["name","email"]
r.items.path=["orders_db","items"]
r.items.type="1n"
r.items.pk="_id"
r.items.fk="orderId"
many=true
e._id=1 e.customer.name=1 e.items=1
```

The `db` and `c` keys are shorthand for the two path segments:

```text
r.customer.db="users_db" r.customer.c="users"
```

`r.x.select` must be a JSON array. A dotted object such as `r.customer.select.name=1` fails validation because relation selects are arrays.

Root relation options use their plain names:

```text
many=true
options.limit=10
```

Do not write `r.many=true` or `r.options.limit=10`. The `r.` prefix always creates a relation entry, so those keys would be interpreted as relations named `many` and `options`.

Top-level relation select keeps nested paths:

```text
e._id=1 e.customer.name=1 e.items=1
```

## Permissions

When permissions are enabled, relation queries are checked before execution:

- The relation `path` requires `READ`.
- Every search field requires `READ`.
- Every selected field requires `READ`.
- Nested relations are checked recursively with the same rules, except that their own `search` is replaced with `{}` during the recursive check, so nested search fields are not checked.

The permission path is built as `[database, collection, ...fieldPath]` for flat string paths. Segment-array selects such as `[["customer", "name"]]` are passed as a single array element instead of being flattened, so prefer flat field paths when permissions are enabled. See [Permissions](./permissions.md).

## Validation

Typical validation errors:

| Message | Cause |
|---------|-------|
| `Relation query 'r' must have a 'path' property with an array of two strings.` | Missing or malformed `path` |
| `Relation query 'r.search' must be an object.` | Missing `search` |
| `Relation query 'r' must have a 'relations' object.` | Missing `relations` |
| `Relation 'x' must have a 'path' property with an array of two strings.` | Bad nested path |
| `Relation 'x' has an invalid 'select' property; it must be an array.` | Object select on a relation |
| `Database "x" not found` | Unregistered database in a path |

## Next steps

- [VQLR](../lang/VQLR.md)
- [VQLS](../lang/VQLS.md)
- [Permissions](./permissions.md)
