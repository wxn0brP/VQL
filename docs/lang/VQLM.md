
# VQLM/VQLB (Multiline/JSON)

## Overview
Structured syntax for complex queries:
- **VQLM**: YAML-like format
- **VQLB**: JSON5 format (same structure as VQLM)

## Structure
```yaml
db1 find users
search:
  status: active
  $gt:
    age: 25

relations:
  orders:
    path: [orders, products]

select:
  name: 1
  orders:
    product: 1

options:
  limit: 5
```

```json5
// VQLB Equivalent
db1 users!
{
  search: {
    status: 'active',
    $gt: {
      age: 25,
    },
  },
  relations: {
    orders: {
      path: [
        'orders',
        'products',
      ],
    },
  },
  select: {
    name: 1,
    orders: {
      product: 1,
    },
  },
  options: {
    limit: 5,
  },
}
```

## Features
### Nested Relations
```yaml
db1 find users
relations:
  orders:
    search:
      status: completed
    select:
      - product
      - total
    relations:
      payments:
        select:
          - amount
          - status
```

### Complex Filters
```yaml
db1 find products
search:
  category: electronics
  price:
    $gt: 500
    $lt: 1000
  tags:
    $in: ["new","featured"]
```

### Aggregations
```yaml
db1 aggregate sales
pipeline:
  - $group:
      _id: "$region"
      total: { $sum: "$amount" }
  - $sort:
      total: -1
```