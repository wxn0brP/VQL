# VQLS (Simple)

## Overview

CLI-friendly, one-liner syntax for quick operations.

## Syntax Components
```bash
<db> <op> <collection> [s.<field>=<val>...] [d.<field>=<val>...] [o.<opt>=<val>...] [r.<rel>=<opts>...]
```

## Operators
| Prefix/Suffix | Operation | Example |
|-------|----------|--------|
| `!` | findOne | `db1 users! s._id=123` |
| `+` | add | `db1 users d.name="Alice"` |
| `~` | update | `db1 ~users s._id=123 u.name="Bob"` |
| `~!` | updateOne | `db1 ~users! s._id=123 u.name="Bob"` |
| `-` | remove | `db1 -user s._id=123` |
| `-!` | removeOne | `db1 -user! s._id=123` |
| `?` | updateOneOrAdd | `db1 ?users s._id=123 u.name="Bob"` |
| `^` | toggleOne | `db1 ^users s._id=123` |

## Prefixes
| Prefix | Purpose | Example |
|-------|--------|--------|
| `s.` | Search conditions | `s.status="active"` |
| `d.` | Data payload | `d.name="John"` |
| `u.` | Update payload | `u.name="John"` |
| `o.` | Options | `o.limit=10` |
| `r.` | Relations | `r.orders.path=["db1", "orders"]` |
| `e.` | Select fields | `e.email=true` |

## Examples
```bash
# Find active users
db1 find users s.status="active" o.limit=5

# Create user
db1 +customers d.name="Alice" d.email="a@x.com"

# Update order status
db1 ~orders! s._id=999 u.status="shipped"

# Delete inactive users
db1 -users s.active=false
```
