# Examples

Runnable patterns for common tasks. All examples assume a processor created as described in [Getting Started](./getting_started.md).

## Setup

```typescript
import VQLProcessor, { VQLConfig, isVQLError } from "@wxn0brp/vql";
import type { VQLUQ } from "@wxn0brp/vql/types/vql";
import { ValtheraCreate } from "@wxn0brp/db";

const main = ValtheraCreate("./data/main");
const analytics = ValtheraCreate("./data/analytics");

const processor = new VQLProcessor(
    { main, analytics },
    new VQLConfig({ noCheckPermissions: true })
);

const run = async <T = any>(query: VQLUQ<T>): Promise<T> => {
    const result = await processor.execute<T>(query);
    if (isVQLError(result)) throw result;
    return result as T;
};
```

## Create and read

```typescript
await run({
    db: "main",
    d: {
        add: {
            collection: "users",
            data: { _id: "u1", name: "Alice", email: "alice@example.com", age: 30 }
        }
    }
});

const user = await run({
    db: "main",
    d: {
        findOne: {
            collection: "users",
            search: { _id: "u1" },
            select: ["name", "email"]
        }
    }
});
```

## Pagination

```typescript
const page = 2;
const pageSize = 20;

const rows = await run({
    db: "main",
    d: {
        find: {
            collection: "users",
            search: { status: "active" },
            options: {
                limit: pageSize,
                offset: (page - 1) * pageSize,
                sortBy: [{ field: "name", asc: true }]
            },
            select: ["_id", "name", "email"]
        }
    }
});

const total = await run({
    db: "main",
    d: { count: { collection: "users", search: { status: "active" } } }
});
```

Use `options.limit`, not the top-level `limit` field.

## Partial update

```typescript
await run({
    db: "main",
    d: {
        updateOne: {
            collection: "users",
            search: { _id: "u1" },
            updater: {
                name: "Alice Smith",
                $set: { profile: { lastLogin: { __: "_now" } } }
            },
            select: ["name", "profile.lastLogin"]
        }
    }
});
```

## Soft delete

```typescript
await run({
    db: "main",
    d: {
        updateOne: {
            collection: "users",
            search: { _id: "u1" },
            updater: { deleted: true, deletedAt: { __: "_now" } }
        }
    }
});

const activeUsers = await run({
    db: "main",
    d: {
        find: {
            collection: "users",
            search: { deleted: false }
        }
    }
});
```

Records created before the flag existed do not have `deleted`. Backfill them, or search with `{ $not: { deleted: true } }` to include missing fields.

## Atomic counter

```typescript
await run({
    db: "analytics",
    d: {
        updateOne: {
            collection: "counters",
            search: { _id: "page-views" },
            updater: { $inc: { value: 1 } }
        }
    }
});
```

For an upsert:

```typescript
await run({
    db: "analytics",
    d: {
        updateOneOrAdd: {
            collection: "counters",
            search: { _id: "page-views" },
            updater: { $inc: { value: 1 } },
            add_arg: { _id: "page-views" }
        }
    }
});
```

## Upsert a profile

```typescript
const { data, type } = await run({
    db: "main",
    d: {
        updateOneOrAdd: {
            collection: "profiles",
            search: { userId: "u1" },
            updater: { lastSeen: { __: "_now" } },
            add_arg: { userId: "u1", displayName: "Alice" },
            select: ["userId", "displayName", "lastSeen"]
        }
    }
});

console.log(type); // "added" or "updated"
```

## Toggle a favorite

```typescript
const result = await run({
    db: "main",
    d: {
        toggleOne: {
            collection: "favorites",
            search: { userId: "u1", itemId: "p42" }
        }
    }
});

console.log(result.type); // "added" or "removed"
console.log(result.data);
```

## Bulk import

```typescript
const inserted = await run({
    db: "main",
    d: {
        bulkAdd: {
            collection: "products",
            datas: [
                { _id: "p1", name: "Laptop", price: 1200 },
                { _id: "p2", name: "Mouse", price: 25 }
            ]
        }
    }
});
```

## Join orders with customers and items

```typescript
const orders = await run({
    r: {
        path: ["main", "orders"],
        search: { status: "pending" },
        many: true,
        relations: {
            customer: {
                path: ["main", "users"],
                type: "1",
                pk: "customerId",
                fk: "_id",
                select: ["name", "email"]
            },
            items: {
                path: ["main", "items"],
                type: "1n",
                pk: "_id",
                fk: "orderId",
                select: ["name", "price", "quantity"]
            }
        },
        options: { limit: 50 },
        select: [["_id"], ["customer", "name"], ["items"]]
    }
});
```

## Multi-database lookup

```typescript
const enriched = await run({
    r: {
        path: ["main", "orders"],
        search: { _id: "o1" },
        relations: {
            customer: {
                path: ["users", "users"],
                pk: "customerId",
                fk: "_id",
                select: ["name"]
            },
            shipment: {
                path: ["logistics", "shipments"],
                pk: "_id",
                fk: "orderId",
                select: ["status", "trackingNumber"]
            }
        }
    }
});
```

Register every referenced database:

```typescript
new VQLProcessor({ main, users, logistics });
```

## Authenticated query with permissions

```typescript
import { PermissionResolverEngine } from "@wxn0brp/vql/permissions/resolver";
import { PermCRUD } from "@wxn0brp/vql/types/perm";

const engine = new PermissionResolverEngine();

engine.addResolver("password", async () => false, "endsWith");

engine.addResolver("main/orders", async ({ p, user }) => {
    if (user?.role === "admin") return true;
    return (p & PermCRUD.READ) !== 0;
}, "startsWith");

const secure = new VQLProcessor(
    { main },
    new VQLConfig({
        noCheckPermissions: false,
        strictSelect: true,
        strictACL: true
    }),
    engine.create()
);

const orders = await secure.execute(
    "main orders s.ownerId=$_me e._id=1 e.total=1",
    { _id: "u1", role: "user" }
);
```

## HTTP endpoint

```typescript
import { FalconFrame } from "@wxn0brp/falcon-frame";
import { FF_VQL } from "@wxn0brp/vql";

const app = new FalconFrame();

FF_VQL(app, secure, {
    path: "/vql",
    getUser: async req => {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) return null;
        return verifyToken(token); // your implementation
    },
    getQuery: async req => ({
        query: req.body.query,
        var: req.body.var
    })
});

app.l(3000);
```

Request:

```json
{
    "query": "main orders s.ownerId=$_me e._id=1 e.total=1",
    "var": {}
}
```

## Scheduled cleanup

```typescript
const old = await run({
    db: "main",
    d: {
        remove: {
            collection: "sessions",
            search: { $lt: { expiresAt: { __: "_now" } } }
        }
    }
});

console.log(`Removed ${old.length} sessions`);
```

## Next steps

- [Relations](../core/relations.md)
- [Permissions](../core/permissions.md)
- [Troubleshooting](./troubleshooting.md)
