# VQLS (Simple)

Human-readable, CLI-friendly string syntax for VQL queries.

## Syntax

```
<db> <operation> <collection> [body...]
```

Or shorthand:
```
<db> <collection_with_operator> [body...]
```

## Shorthand Operators

| Prefix/Suffix | Operation | Example |
|---------------|-----------|---------|
| *(none)* | find | `db users` |
| `!` | findOne | `db users!` |
| `+` | add | `db +users` |
| `~` | update | `db ~users` |
| `~!` | updateOne | `db ~users!` |
| `-` | remove | `db -users` |
| `-!` | removeOne | `db -users!` |
| `?` | updateOneOrAdd | `db ?users` |
| `^` | toggleOne | `db ^users` |

## Explicit Operations

```bash
db find users s.status="active"
db findOne users s._id="123"
db add users d.name="Alice"
db update users s.role="guest" u.role="user"
db updateOne users s._id="123" u.name="Bob"
db remove users s.active=false
db removeOne users s._id="123"
db updateOneOrAdd users s._id="123" u.name="Bob"
db toggleOne users s._id="123"
db ensureCollection logs
db issetCollection logs
db removeCollection temp_data
db getCollections
```

## Body Prefixes

| Prefix | Purpose | Example |
|--------|---------|---------|
| `s.` | Search conditions | `s.status="active"` |
| `d.` | Data payload (add) | `d.name="Alice"` |
| `u.` | Update payload | `u.name="Bob"` |
| `o.` | Options | `o.limit=10` |
| `r.` | Relations | `r.orders.path=["db", "orders"]` |
| `e.` | Field selection | `e.name=1 e.email=1` |

## Comparison Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `=` | Equal | `s.age=25` |
| `>` | Greater than | `s.age>18` |
| `>=` | Greater or equal | `s.age>=18` |
| `<` | Less than | `s.price<100` |
| `<=` | Less or equal | `s.price<=100` |

## Value Types

| Type | Syntax | Example |
|------|--------|---------|
| String | `"value"` or `'value'` | `s.name="Alice"` |
| Number | Numeric | `s.age=25` |
| Boolean | `true` / `false` | `s.active=true` |
| Empty = true | Empty value | `s.active=` |
| JSON | `{...}` or `[...]` | `s.tags=["a","b"]` |

## Nested Properties

```bash
db users s.address.city="NYC"
db users s.profile.age>18
```

## Comments

Lines starting with `#` or `//` are ignored:
```bash
# This is a comment
db users s.status="active"
// Another comment
```

## Variables

See [Language Overview](./base.md#variables) for details.

```bash
# Custom variable
db users s.role=$role

# Predefined variables
db users d.createdAt=$_now
db users s.ownerId=$_me
```

## Examples

```bash
# Find with filters and field selection
db users s.status="active" s.age>18 e.name=1 e.email=1 o.limit=10

# Add record
db +users d.name="Alice" d.email="alice@example.com" d.age=30

# Update single record
db ~users! s._id="123" u.name="Bob" u.updatedAt=$_now

# Upsert
db ?users s._id="123" u.name="Bob" u.lastSeen=$_now

# Delete
db -users s.active=false
db -users! s._id="123"

# Toggle
db ^users s._id="123"

# Relations
db users r.orders.path=["db", "orders"] r.orders.search.status="pending"

# Collection management
db ensureCollection logs
db getCollections
```

## Multi-line Queries

```typescript
const query = `
  db users
  s.status="active"
  s.age>18
  e.name=1
  e.email=1
`;
```
