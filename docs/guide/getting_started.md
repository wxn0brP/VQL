# Getting Started

## Requirements

- Bun or Node.js
- [ValtheraDB](https://github.com/wxn0brP/ValtheraDB) for local storage

```bash
bun add @wxn0brp/vql @wxn0brp/db
```

If you plan to expose an HTTP endpoint, also install Falcon Frame:

```bash
bun add @wxn0brp/falcon-frame
```

## Step 1: Create databases

```typescript
import VQLProcessor from "@wxn0brp/vql";
import { ValtheraCreate } from "@wxn0brp/db";

const usersDb = ValtheraCreate("./data/users");
const productsDb = ValtheraCreate("./data/products");

await usersDb.add({
    collection: "users",
    data: { _id: "user1", name: "Alice", age: 30, role: "admin" }
});

await usersDb.add({
    collection: "users",
    data: { _id: "user2", name: "Bob", age: 25, role: "user" }
});

await productsDb.add({
    collection: "items",
    data: { _id: "item1", name: "Laptop", price: 1200 }
});

const processor = new VQLProcessor({
    users: usersDb,
    products: productsDb
});
```

The keys in the object are the database names used by queries.

## Step 2: Query with VQLR

VQLR is the object form. It is explicit and works well with TypeScript.

```typescript
import type { VQLUQ } from "@wxn0brp/vql/types/vql";

const query: VQLUQ = {
    db: "users",
    d: {
        find: {
            collection: "users",
            search: { $gt: { age: 20 } },
            select: { name: 1, age: 1 },
            options: { sortBy: [{ field: "age", asc: true }] }
        }
    }
};

const result = await processor.execute(query);
// [{ name: "Bob", age: 25 }, { name: "Alice", age: 30 }]
```

## Step 3: Query with VQLS

VQLS is the string form. It is shorter and works well in scripts, logs, and CLI tools.

```typescript
const result = await processor.execute(
    `products items s.$gt.price=100 e.name=1 e.price=1`
);
// [{ name: "Laptop", price: 1200 }]
```

Comparison operators have shorthand:

```typescript
await processor.execute(`users users s.age>20 e.name=1`);
await processor.execute(`users users s.age>=20 e.name=1`);
```

## Step 4: Write data

```typescript
// Insert
await processor.execute(`users +users d.name="Charlie" d.age=22 d.role="user"`);

// Update one record
await processor.execute(
    `users ~users! s._id="user2" u.age=26 u.updatedAt=$_now`
);

// Upsert
await processor.execute(
    `users ?users s._id="user3" u.name="Dana" u.age=28`
);

// Delete one record
await processor.execute(`users -users! s._id="user3"`);

// Count
const active = await processor.execute(`users #users s.role="admin"`);
```

## Step 5: Variables

Predefined variables are available in both syntaxes:

| Variable | Value |
|----------|-------|
| `_me` | User id |
| `_user` | Full user object |
| `_now` | Milliseconds timestamp |
| `_nowShort` | Seconds timestamp |
| `__now` | Milliseconds as a string |
| `__nowShort` | Seconds as a string |

```typescript
const result = await processor.execute(
    {
        query: `users users s.age>$minAge e.name=1`,
        var: { minAge: 24 }
    },
    { _id: "viewer1", role: "user" }
);
```

In VQLR, use reference objects:

```typescript
await processor.execute({
    db: "users",
    d: {
        add: {
            collection: "audit",
            data: { action: "login", userId: { __: "_me" }, at: { __: "_now" } }
        }
    }
});
```

## Step 6: Relations

Relation queries join data across collections and databases.

```typescript
await productsDb.add({
    collection: "orders",
    data: { _id: "order1", userId: "user1", itemId: "item1", quantity: 1 }
});

const orders = await processor.execute({
    r: {
        path: ["products", "orders"],
        search: {},
        many: true,
        relations: {
            user: {
                path: ["users", "users"],
                pk: "userId",
                fk: "_id",
                select: ["name", "role"]
            },
            item: {
                path: ["products", "items"],
                pk: "itemId",
                fk: "_id",
                select: ["name", "price"]
            }
        },
        select: [["_id"], ["user", "name"], ["item", "name"]]
    }
});
```

The same query in VQLS:

```text
products orders
r.user.path=["users","users"]
r.user.pk="userId"
r.user.fk="_id"
r.user.select=["name","role"]
r.item.path=["products","items"]
r.item.pk="itemId"
r.item.fk="_id"
r.item.select=["name","price"]
many=true
e._id=1 e.user.name=1 e.item.name=1
```

See [Relations](../core/relations.md) for relation types and many-to-many joins.

## Step 7: Collection management

```typescript
await processor.execute(`users ensureCollection logs`);
const collections = await processor.execute(`users getCollections`);
await processor.execute(`users removeCollection logs`);
```

## Step 8: Enable permissions

Permissions are off by default. To enable them, pass a config and a permission function:

```typescript
import { VQLConfig } from "@wxn0brp/vql";
import { PermissionResolverEngine } from "@wxn0brp/vql/permissions/resolver";
import { PermCRUD } from "@wxn0brp/vql/types/perm";

const engine = new PermissionResolverEngine();
engine.addResolver("password", async () => false, "endsWith");
engine.addResolver("users/users", async ({ p, user }) => {
    if (user?.role === "admin") return true;
    return (p & PermCRUD.READ) !== 0;
}, "startsWith");

const secureProcessor = new VQLProcessor(
    { users: usersDb, products: productsDb },
    new VQLConfig({
        noCheckPermissions: false,
        strictSelect: true,
        strictACL: true
    }),
    engine.create()
);

const user = { _id: "user1", role: "admin" };
const result = await secureProcessor.execute(
    `users users s.role="admin" e.name=1 e.role=1`,
    user
);
```

See [Permissions](../core/permissions.md) for path rules, hashing, and Gate Warden.

## Step 9: Handle errors

`execute()` returns a `VQLError` instead of throwing:

```typescript
import { isVQLError } from "@wxn0brp/vql";

const result = await processor.execute(`missing users`);
if (isVQLError(result)) {
    console.error(result.code);       // VQL_DB_NOT_FOUND
    console.error(result.message);
    console.error(result.suggestion);
}
```

See [Errors](../core/errors.md).

## Step 10: Expose over HTTP

```typescript
import { FalconFrame } from "@wxn0brp/falcon-frame";
import { FF_VQL } from "@wxn0brp/vql";

const app = new FalconFrame();
FF_VQL(app, processor);
app.l(3000);
```

The endpoint accepts:

```json
{ "query": "users users s.role=\"admin\"" }
```

and returns:

```json
{ "err": false, "result": [] }
```

See [HTTP Integration](../integration/http.md).

## Next steps

- [Language Overview](../lang/base.md)
- [VQLS](../lang/VQLS.md)
- [VQLR](../lang/VQLR.md)
- [Configuration](../core/configuration.md)
- [Examples](./examples.md)
