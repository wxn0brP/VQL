# VQLR (Runtime)

JSON-based object syntax for VQL. The internal AST format, ideal for programmatic use and TypeScript.

## Structure

```typescript
interface VQL_Query {
  db?: string;           // Target database instance
  d?: VQL_Query_CRUD;    // CRUD operation
  r?: VQL_Query_Relation; // Relational query
  var?: Record<string, any>; // Variables
}
```

## CRUD Operations (`d` key)

### find

```typescript
interface VQL_OP_Find {
  collection: string;
  search?: Search;
  limit?: number;
  select?: VQL_Fields;
  options?: DbFindOpts;
  searchOpts?: FindOpts;
}

{ db: "main", d: { find: { collection: "users", search: { status: "active" }, limit: 10, select: { name: 1 } } } }
```

### findOne / f

```typescript
interface VQL_OP_FindOne {
  collection: string;
  search: Search;
  select?: VQL_Fields;
  searchOpts?: FindOpts;
}

{ db: "main", d: { findOne: { collection: "users", search: { _id: "123" } } } }
{ db: "main", d: { f: { collection: "users", search: { _id: "123" } } } }  // alias
```

### add

```typescript
interface VQL_OP_Add {
  collection: string;
  data: Arg;
  id_gen?: boolean;  // default: true
}

{ db: "main", d: { add: { collection: "users", data: { name: "Alice", age: 30 } } } }
```

### update / updateOne

```typescript
interface VQL_OP_Update {
  collection: string;
  search: Search;
  updater: UpdaterArg;
}

{ db: "main", d: { update: { collection: "users", search: { role: "guest" }, updater: { role: "user" } } } }
{ db: "main", d: { updateOne: { collection: "users", search: { _id: "123" }, updater: { name: "Bob" } } } }
```

### remove / removeOne

```typescript
interface VQL_OP_Remove {
  collection: string;
  search: Search;
}

{ db: "main", d: { remove: { collection: "users", search: { active: false } } } }
{ db: "main", d: { removeOne: { collection: "users", search: { _id: "123" } } } }
```

### updateOneOrAdd

```typescript
interface VQL_OP_UpdateOneOrAdd {
  collection: string;
  search: Search;
  updater: UpdaterArg;
  add_arg?: Arg;
  id_gen?: boolean;
}

{ db: "main", d: { updateOneOrAdd: { collection: "users", search: { _id: "123" }, updater: { name: "Bob" }, add_arg: { name: "Bob", email: "b@x.com" } } } }
```

### toggleOne

```typescript
interface VQL_OP_ToggleOne {
  collection: string;
  search: Search;
  data?: Arg;
}

{ db: "main", d: { toggleOne: { collection: "favorites", search: { userId: "123", itemId: "456" } } } }
```

## Collection Management

```typescript
{ db: "main", d: { ensureCollection: { collection: "logs" } } }
{ db: "main", d: { issetCollection: { collection: "logs" } } }
{ db: "main", d: { removeCollection: { collection: "temp" } } }
{ db: "main", d: { getCollections: {} } }
```

## Relational Queries (`r` key)

```typescript
interface VQL_Query_Relation {
  r: {
    path: [string, string];           // [db, collection]
    search?: Search;
    relations?: Record<string, {
      path: [string, string];
      search?: Search;
      select?: string[];
    }>;
    many?: boolean;                   // true = find, false = findOne
    options?: DbFindOpts;
    select?: string[] | Record<string, any>;
  };
}

{
  r: {
    path: ["main", "orders"],
    search: { status: "pending" },
    many: true,
    relations: {
      customer: { path: ["main", "users"], select: ["name", "email"] },
      items: { path: ["inventory", "products"] }
    }
  }
}
```

## Field Selection

```typescript
// Record format
select: { name: 1, email: 1 }

// Array format
select: ["name", "email"]
```

## Variables

Use `{ __: "variableName" }` for references. See [Language Overview](./base.md#variables).

```typescript
{
  db: "main",
  d: { add: { collection: "users", data: { ownerId: { __: "_me" }, createdAt: { __: "_now" } } } },
  var: { customVar: "value" }
}
```

## TypeScript Types

```typescript
import type {
  VQL_Query, VQL_Query_CRUD, VQL_Query_Relation,
  VQL_OP_Find, VQL_OP_FindOne, VQL_OP_Add,
  VQL_OP_Update, VQL_OP_Remove, VQL_OP_UpdateOneOrAdd,
  VQL_OP_ToggleOne, VQL_Fields, VQL_Var
} from "@wxn0brp/vql";
```

## Examples

### Find with all options

```typescript
{
  db: "main",
  d: {
    find: {
      collection: "users",
      search: { status: "active", $gt: { age: 18 }, $lte: { age: 65 } },
      select: { name: 1, email: 1 },
      limit: 50,
      options: { sort: { age: -1 } },
      searchOpts: { skip: 10 }
    }
  }
}
```

### Update with operators

```typescript
{
  db: "main",
  d: {
    updateOne: {
      collection: "users",
      search: { _id: "123" },
      updater: {
        name: "Bob",
        $inc: { loginCount: 1 },
        $set: { "profile.lastLogin": { __: "_now" } }
      }
    }
  }
}
```

### Multi-database relations

```typescript
{
  r: {
    path: ["orders_db", "orders"],
    search: { status: "shipped" },
    many: true,
    relations: {
      customer: { path: ["users_db", "users"], select: ["name", "email"] },
      items: { path: ["inventory_db", "products"] }
    }
  }
}
```
