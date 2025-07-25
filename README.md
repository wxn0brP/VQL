# VQL (Valthera Query Language)

VQL is a query language and processing framework designed for managing and interacting with databases using ValtheraDB. It provides a robust permission system, query execution, and a GUI for managing ACL rules and database structures.

[![npm version](https://img.shields.io/npm/v/@wxn0brp/vql)](https://www.npmjs.com/package/@wxn0brp/vql)
[![License](https://img.shields.io/npm/l/@wxn0brp/vql)](./LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@wxn0brp/vql)](https://www.npmjs.com/package/@wxn0brp/vql)

## Features

- **Query Execution**: Supports CRUD operations and advanced query capabilities.
- **Permission Management**: Fine-grained access control using Gate Warden.
- **GUI**: A web-based interface for managing ACL rules and database structures.
- **Extensibility**: Easily extendable with pre-defined sheets and custom configurations.

## Example Usage

Here is an example of how to use the `VQLProcessor` to execute a query:

```typescript
import VQLProcessor from "@wxn0brp/vql";
import { Valthera } from "@wxn0brp/db";
import { GateWarden } from "@wxn0brp/gate-warden";

// Initialize database instances
const dbInstances = {
    myDatabase: new Valthera("path/to/database"),
};

// Initialize Gate Warden
const gw = new GateWarden("path/to/gate-warden/database");

// Create a VQLProcessor instance
const processor = new VQLProcessor(dbInstances, gw);

// Define a query (VQLR)
const query = {
    db: "myDatabase",
    d: {
        find: {
            collection: "users",
            search: { age: { $gt: 18 } },
            fields: { name: 1, age: 1 },
        },
    },
};

// Or you can use a string query like:
// simple
const VQLS = `
myDatabase users
s.$gt.age = 18
f.name = 1
f.age = 1
`
// Or (use backticks like json)
const VQLB = `
myDatabase users
{
    collection: "users",
    search: { $gt: { age: 18 } },
    fields: { name: 1, age: 1 },
}
`
// Or (use markup like yaml)
const VQLM = `
myDatabase users
collection: users
search:
  $gt:
    age: 18
fields:
  name: 1
  age: 1
`

// Execute the query
(async () => {
    try {
        const result = await processor.execute(query, { id: "user123" });
        console.log("Query Result:", result);
    } catch (error) {
        console.error("Error executing query:", error);
    }
})();
```

## Documentation

- [Base/Map](./docs/lang/base.md)
- [VQLS](./docs/lang/VQLS.md)
- [VQLM/B](./docs/lang/VQLM.md)
- [VQLR](./docs/lang/VQLR.md)

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## Powered by

- [ValtheraDB](https://github.com/wxn0brP/ValtheraDB)
- [Gate Warden](https://github.com/wxn0brP/gate-warden)
