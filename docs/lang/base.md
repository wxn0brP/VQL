# Language Overview

VQL provides two interchangeable query syntaxes that compile to the same internal representation.

## Syntaxes

| Syntax | Format | Best For |
|--------|--------|----------|
| **[VQLS](./VQLS.md)** | String | CLI, configs, quick scripts |
| **[VQLR](./VQLR.md)** | Object | Programmatic use, TypeScript |

## Operations

| Operation | VQLS | VQLR Key | Description |
|-----------|------|----------|-------------|
| find | `db collection` | `find` | Find multiple records |
| findOne | `db collection!` | `findOne` / `f` | Find single record |
| add | `db +collection` | `add` | Insert record |
| update | `db ~collection` | `update` | Update matching |
| updateOne | `db ~collection!` | `updateOne` | Update single |
| remove | `db -collection` | `remove` | Delete matching |
| removeOne | `db -collection!` | `removeOne` | Delete single |
| updateOneOrAdd | `db ?collection` | `updateOneOrAdd` | Upsert |
| toggleOne | `db ^collection` | `toggleOne` | Add/remove toggle |
| ensureCollection | `db ensureCollection name` | `ensureCollection` | Create if not exists |
| issetCollection | `db issetCollection name` | `issetCollection` | Check exists |
| removeCollection | `db removeCollection name` | `removeCollection` | Delete collection |
| getCollections | `db getCollections` | `getCollections` | List collections |

## Body Prefixes

| Prefix | Purpose | VQLR Key |
|--------|---------|----------|
| `s.` | Search/filter | `search` |
| `d.` | Data (for add) | `data` |
| `u.` | Update payload | `updater` |
| `o.` | Options (limit) | `options` |
| `r.` | Relations | `relations` |
| `e.` | Field selection | `select` |

## Comparison Operators (VQLS)

| Operator | Meaning | Example |
|----------|---------|---------|
| `=` | Equal | `s.age=25` |
| `>` | Greater than | `s.age>18` |
| `>=` | Greater or equal | `s.age>=18` |
| `<` | Less than | `s.price<100` |
| `<=` | Less or equal | `s.price<=100` |

## Variables

Inject dynamic values into queries.

### Predefined

| Variable | Value |
|----------|-------|
| `_me` | `user.id \|\| user._id \|\| user` |
| `_user` | Full user object |
| `_now` | `Date.now()` (ms) |
| `_nowShort` | `Math.floor(Date.now() / 1000)` (s) |
| `__now` | `Date.now().toString()` |
| `__nowShort` | Seconds as string |

### Usage

**VQLS** - `$variableName` in values:
```bash
db users s.role=$role d.createdAt=$_now
```

**VQLR** - `{ __: "variableName" }` for references:
```typescript
{ data: { ownerId: { __: "_me" }, createdAt: { __: "_now" } } }
```

**Pass custom variables:**
```typescript
// VQLS with vars
await processor.execute({ query: `users s.role=$role`, var: { role: "admin" } });

// VQLR with vars
await processor.execute({ db: "main", d: { find: {...} }, var: { custom: "val" } });
```

## TypeScript Types

```typescript
import type { VQLUQ, VQL_Query, VQL_Query_CRUD } from "@wxn0brp/vql";

const q1: VQLUQ = `users s.status="active"`;
const q2: VQLUQ = { db: "main", d: { find: { collection: "users" } } };
```
