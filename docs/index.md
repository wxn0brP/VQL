# VQL (Valthera Query Language)

VQL is a comprehensive framework for interacting with ValtheraDB. It provides dual query syntaxes, advanced relation handling, and an integrated permission system.

## Key Features

- **Dual Query Syntax**: VQLR (JSON-based, programmatic) and VQLS (string-based, CLI-friendly)
- **Multi-Database Support**: Query across multiple ValtheraDB instances
- **Cross-Platform**: Node.js and browser compatible
- **Dynamic Variables**: Predefined (`_me`, `_user`, `_now`) and custom variables
- **Advanced Relations**: Native cross-database relationship queries
- **Permission System**: Optional, granular access control via Gate Warden
- **Falcon Frame Integration**: HTTP API exposure

## Quick Example

```typescript
import VQLProcessor from "@wxn0brp/vql";
import { Valthera } from "@wxn0brp/db";

const db = new Valthera("./data/my-db");
const processor = new VQLProcessor({ main: db });

// VQLS
const result1 = await processor.execute(`main users s.status="active" e.name=1`);

// VQLR
const result2 = await processor.execute({
  db: "main",
  d: { find: { collection: "users", search: { status: "active" }, select: ["name"] } }
});

// With variables
const result3 = await processor.execute({
  query: `main ~users! s.role=$role u.lastLogin=$_now`,
  var: { role: "admin" }
}, userContext);
```

## VQLProcessor

```typescript
import VQLProcessor, { VQLConfig } from "@wxn0brp/vql";

const processor = new VQLProcessor(
  dbInstances,  // Record<string, ValtheraCompatible>
  config,       // VQLConfig (optional)
  permValidFn   // Permission function (optional)
);

const result = await processor.execute(query, user);
```

## Configuration

```typescript
const config = new VQLConfig({
  noCheckPermissions: true,   // Default: true (permissions disabled)
  strictSelect: false,        // Empty select = no filtering (true = no fields)
  strictACL: false,           // Fallback to parent path on 404
  hidePath: false,            // Show actual paths in errors
  permissionDeniedIfNoUser: true  // Deny if no user context
});
```

## Query Lifecycle

1. Parse query (VQLS → VQLR or pass-through)
2. Validate raw structure (`r` or `db`+`d` keys)
3. Resolve variables (`$var`, `{__: "var"}`)
4. Validate VQL query (detailed structure check)
5. Check permissions (if enabled)
6. Execute against ValtheraDB
7. Return result
