# VQL (Valthera Query Language)

VQL is a query framework for [ValtheraDB](https://github.com/wxn0brP/ValtheraDB). It provides two query syntaxes, cross-database relation loading, an optional path-based permission system, an HTTP endpoint, and adapters for non-Valthera data sources.

## Features

- **Dual syntax**: VQLS strings for scripts and CLI, VQLR objects for application code and TypeScript.
- **Multiple databases**: one processor can serve any number of named ValtheraDB instances.
- **Relations**: joins across collections and databases, including nested relations and many-to-many through pivot collections.
- **Variables**: predefined `_me`, `_user`, `_now`, `_nowShort`, `__now`, and `__nowShort`, plus custom values.
- **Permissions**: optional CRUD and field-level checks with result filtering, backed by your own function or Gate Warden.
- **Adapters**: run VQL over an HTTP API, a custom SDK, or per-collection handlers.
- **HTTP API**: ready-made Falcon Frame integration with structured errors.
- **Browser compatible**: the parser, validator, permissions, and adapters run in the browser when the database is remote.

## Install

```bash
bun add @wxn0brp/vql @wxn0brp/db
```

`@wxn0brp/vql` peers:

| Package | Required | Purpose |
|---------|----------|---------|
| `@wxn0brp/db-core` | yes | Query types and the database interface |
| `@wxn0brp/falcon-frame` | no | HTTP integration |
| `@wxn0brp/gate-warden` | no | Permission backend |

## Quick start

```typescript
import VQLProcessor, { VQLConfig, isVQLError } from "@wxn0brp/vql";
import { ValtheraCreate } from "@wxn0brp/db";

const main = ValtheraCreate("./data/main");
const processor = new VQLProcessor({ main });

// VQLS
const users = await processor.execute(
    `main users s.status="active" e.name=1 e.email=1`
);

// VQLR
const user = await processor.execute({
    db: "main",
    d: {
        findOne: {
            collection: "users",
            search: { _id: "u1" },
            select: ["name", "email"]
        }
    }
});

// Variables and user context
const mine = await processor.execute(
    {
        query: "main orders s.ownerId=$_me e._id=1 e.total=1",
        var: {}
    },
    { _id: "u1", role: "user" }
);

if (isVQLError(users)) {
    console.error(users.code, users.message);
}
```

## Configuration

```typescript
const processor = new VQLProcessor(
    { main },
    new VQLConfig({
        noCheckPermissions: true,       // default: permissions disabled
        strictSelect: false,            // must be true when permissions are enabled
        strictACL: false,               // allow parent-path fallback
        hidePath: false,                // hash paths passed to permValidFn
        permissionDeniedIfNoUser: true,
        allowEmptyAdd: true
    })
);
```

See [Configuration](./core/configuration.md) for the full behavior of each option.

## Query lifecycle

1. Parse the query.
   - Strings and `{ query: string }` go through the VQLS parser.
   - Objects are used as VQLR.
2. Apply variables from the wrapper.
3. Check the raw shape: `r`, or `db` + `d`.
4. Expand predefined and custom variables.
5. Validate the operation, collection, and relation structure.
6. Check permissions when enabled.
7. Execute:
   - `d` runs a CRUD operation against one database.
   - `r` loads records and relations across databases.
8. Filter returned fields when permissions are enabled.
9. Return the result or a `VQLError`.

## Documentation map

| Page | Contents |
|------|----------|
| [Getting Started](./guide/getting_started.md) | Install, first queries, CRUD, variables |
| [Language Overview](./lang/base.md) | Operations, operators, variables, types |
| [VQLS](./lang/VQLS.md) | String grammar, shorthands, values, gotchas |
| [VQLR](./lang/VQLR.md) | Object structure for every operation |
| [Configuration](./core/configuration.md) | All `VQLConfig` options and presets |
| [Relations](./core/relations.md) | Joins, relation types, nested select |
| [Permissions](./core/permissions.md) | Paths, CRUD flags, resolvers, Gate Warden |
| [Adapters](./core/adapters.md) | `LowAdapter`, `createValtheraAdapter`, `AdapterBuilder` |
| [Errors](./core/errors.md) | Error classes, codes, handling |
| [HTTP Integration](./integration/http.md) | Falcon Frame endpoint and client |
| [Browser Usage](./integration/browser.md) | HTTP client and BroadcastChannel usage |
| [Examples](./guide/examples.md) | Pagination, soft delete, joins, auth |
| [Troubleshooting](./guide/troubleshooting.md) | Common errors and fixes |

## Project links

- [ValtheraDB](https://github.com/wxn0brP/ValtheraDB)
- [Gate Warden](https://github.com/wxn0brP/gate-warden)
- [VQL-dev](https://github.com/wxn0brP/VQL-dev)
- [Type definitions](https://wxn0brp.github.io/VQL/types)
- [License](https://github.com/wxn0brP/VQL/blob/master/LICENSE)
