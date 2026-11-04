# VQL (Valthera Query Language)

VQL is a query framework for [ValtheraDB](https://github.com/wxn0brP/ValtheraDB).
It combines two query syntaxes, cross-database relations, an optional permission
system, HTTP integration, and adapters for external data sources.

[![npm version](https://img.shields.io/npm/v/@wxn0brp/vql)](https://www.npmjs.com/package/@wxn0brp/vql)
[![License](https://img.shields.io/npm/l/@wxn0brp/vql)](./LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@wxn0brp/vql)](https://www.npmjs.com/package/@wxn0brp/vql)
![CI](https://img.shields.io/github/actions/workflow/status/wxn0brP/VQL/build.yml?branch=master)
![bundle size](https://img.shields.io/bundlephobia/minzip/@wxn0brp/vql)

## Features

- **VQLS**: a compact string syntax for CLI tools, configs, and scripts.
- **VQLR**: a JSON object syntax for application code and TypeScript.
- **Multi-database**: query any number of named ValtheraDB instances.
- **Relations**: joins across collections and databases, including nested and
  many-to-many relations.
- **Variables**: `_me`, `_user`, `_now`, `_nowShort`, `__now`, `__nowShort`, and
  custom values.
- **Permissions**: optional CRUD and field-level checks with result filtering.
- **Adapters**: use HTTP APIs, custom SDKs, or per-collection handlers.
- **HTTP API**: Falcon Frame endpoint with structured errors.
- **Browser compatible**: run the processor against a remote backend.

## Install

```bash
bun add @wxn0brp/vql @wxn0brp/db
```

Optional peers:

```bash
bun add @wxn0brp/falcon-frame   # HTTP endpoint
bun add @wxn0brp/gate-warden    # permission backend
```

## Quick start

```typescript
import VQLProcessor, { isVQLError } from "@wxn0brp/vql";
import { ValtheraCreate } from "@wxn0brp/db";

const db = ValtheraCreate("./data/app");
const processor = new VQLProcessor({ main: db });

// VQLS
const active = await processor.execute(
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
    { query: "main orders s.ownerId=$_me e._id=1 e.total=1", var: {} },
    { _id: "u1", role: "user" }
);

if (isVQLError(active)) {
    console.error(active.code, active.message);
}
```

`execute()` returns either the result or a `VQLError`. See
[Errors](https://wxn0brp.github.io/VQL/core/errors/).

## Documentation

Full documentation: [wxn0brp.github.io/VQL](https://wxn0brp.github.io/VQL)

- [Getting Started](https://wxn0brp.github.io/VQL/guide/getting_started/)
- [VQLS](https://wxn0brp.github.io/VQL/lang/VQLS/)
- [VQLR](https://wxn0brp.github.io/VQL/lang/VQLR/)
- [Configuration](https://wxn0brp.github.io/VQL/core/configuration/)
- [Relations](https://wxn0brp.github.io/VQL/core/relations/)
- [Permissions](https://wxn0brp.github.io/VQL/core/permissions/)
- [Adapters](https://wxn0brp.github.io/VQL/core/adapters/)
- [HTTP Integration](https://wxn0brp.github.io/VQL/integration/http/)
- [Browser Usage](https://wxn0brp.github.io/VQL/integration/browser/)
- [Examples](https://wxn0brp.github.io/VQL/guide/examples/)
- [Troubleshooting](https://wxn0brp.github.io/VQL/guide/troubleshooting/)
- [Type definitions](https://wxn0brp.github.io/VQL/types)

## Development

```bash
bun install
bun test
bun run build
```

The docs are built with MkDocs:

```bash
mkdocs build --clean
```

## Related projects

- [ValtheraDB](https://github.com/wxn0brP/ValtheraDB)
- [Gate Warden](https://github.com/wxn0brP/gate-warden)
- [VQL-dev](https://github.com/wxn0brP/VQL-dev)

## License

MIT. See [LICENSE](./LICENSE).
