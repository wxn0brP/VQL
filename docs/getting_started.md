# Getting Started

## Prerequisites

- Node.js (or Bun)
- [`ValtheraDB`](https://github.com/wxn0brP/ValtheraDB) installed

```bash
npm install @wxn0brp/db @wxn0brp/vql
```

## Step 1: Initialize

```typescript
import VQLProcessor from "@wxn0brp/vql";
import { Valthera } from "@wxn0brp/db";

const userDb = new Valthera("./data/users-db");
const productDb = new Valthera("./data/products-db");

// Add sample data
await userDb.add("users", { _id: "user1", name: "Alice", age: 30 });
await userDb.add("users", { _id: "user2", name: "Bob", age: 25 });
await productDb.add("items", { _id: "item1", name: "Laptop", price: 1200 });

const dbInstances = { users: userDb, products: productDb };
const processor = new VQLProcessor(dbInstances);
```

## Step 2: VQLR Query (Object Syntax)

```typescript
import type { VQLUQ } from "@wxn0brp/vql";

const query: VQLUQ = {
  db: "users",
  d: {
    find: {
      collection: "users",
      search: { $gt: { age: 20 } },
      select: { name: 1, age: 1 }
    }
  }
};

const result = await processor.execute(query);
// [{ name: "Alice", age: 30 }, { name: "Bob", age: 25 }]
```

## Step 3: VQLS Query (String Syntax)

```typescript
const query: VQLUQ = `products items s.$gt.price=100 e.name=1 e.price=1`;
const result = await processor.execute(query);
// [{ name: "Laptop", price: 1200 }]
```

## Step 4: Variables

```typescript
// Predefined variables
await processor.execute(`users +users d.name="Charlie" d.createdAt=$_now`);

// Custom variables
const result = await processor.execute({
  query: `users users s.age>$minAge e.name=1`,
  var: { minAge: 25 }
});
```

## Step 5: Update Data

```typescript
// VQLS updateOne
await processor.execute(`products ~items! s.name="Laptop" u.price=1100`);

// Verify
const item = await processor.execute(`products items s.name="Laptop"`);
```

## Step 6: Collection Management

```typescript
await processor.execute(`users ensureCollection logs`);
const collections = await processor.execute(`users getCollections`);
await processor.execute(`users removeCollection logs`);
```

## Step 7: Enable Permissions (Optional)

```typescript
import { VQLConfig } from "@wxn0brp/vql";
import { PermissionResolverEngine } from "@wxn0brp/vql/permissions/resolver";

const engine = new PermissionResolverEngine();
engine.addResolver("password", async () => false, "endsWith");
const permValidFn = engine.create();

const secureProcessor = new VQLProcessor(
  dbInstances,
  new VQLConfig({ noCheckPermissions: false }),
  permValidFn
);

const user = { _id: "user123", role: "admin" };
const result = await secureProcessor.execute(query, user);
```

## Next Steps

- **[Language Overview](./lang/base.md)** - Operations reference
- **[Permissions](permissions.md)** - Access control
- **[HTTP Integration](integration_http.md)** - Expose via API
