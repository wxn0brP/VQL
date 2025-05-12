# VQLR (Runtime)

## Overview
Internal AST format used by the engine. Used for:
- Direct engine interaction
- Complex queries beyond DSL capabilities
- Query manipulation in code

## Interface
```ts
interface VQL {
  r?: {
    path: [string, string]; // [db, collection]
    search?: Record<string, any>;
    select?: Array<string[]>;
    relations?: Record<string, {
      path: [string, string];
      search?: Record<string, any>;
      select?: string[];
    }>;
    options?: { 
      limit?: number;
    };
    many: boolean; // find vs findOne (default: false = findOne)
  };

  db?: string;
  d?: {
    [op in "find"|"findOne"|"add"|"update"|"remove"]: {
      collection: string;
      search?: Record<string, any>;
      data?: Record<string, any>;
      updater?: Record<string, any>;
    };
  };
}
```

## Examples
### Basic Find
```ts
const query: VQL = {
  r: {
    path: ["db1", "users"],
    search: { status: "active" },
    select: [["name"], ["email"]],
    options: { limit: 10 },
    many: true
  }
};
```

### Nested Relations
```ts
const query: VQL = {
  r: {
    path: ["db1", "orders"],
    relations: {
      customer: {
        path: ["customers", "users"],
        select: ["name", "email"]
      },
      items: {
        path: ["products", "items"],
        search: { $gt: { stock: 0 } }
      }
    }
  }
};
```

### Complex Update
```ts
const query: VQL = {
  d: {
    update: {
      collection: "users",
      search: { _id: "123" },
      data: { 
        status: "inactive",
        $inc: { loginCount: true }
      }
    }
  }
};
```