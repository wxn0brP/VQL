# VQL (Valthera Query Language)

VQL (Valthera Query Language) is a comprehensive framework for interacting with ValtheraDB. It combines a flexible query language, a powerful permission management system, and a suite of tools to build secure and efficient data-driven applications.

[![npm version](https://img.shields.io/npm/v/@wxn0brp/vql)](https://www.npmjs.com/package/@wxn0brp/vql)
[![License](https://img.shields.io/npm/l/@wxn0brp/vql)](./LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@wxn0brp/vql)](https://www.npmjs.com/package/@wxn0brp/vql)
![CI](https://img.shields.io/github/actions/workflow/status/wxn0brP/VQL/build.yml?branch=master)
![bundle size](https://img.shields.io/bundlephobia/minzip/@wxn0brp/vql)

## Key Features

- **Dual Query Syntax**: Choose between VQLR (a JSON-based object query language for programmatic use) and VQLS (a human-readable string-based language for simpler queries and scripts).
- **Multi-Database Support**: Process queries across multiple ValtheraDB instances seamlessly.
- **Cross-Platform**: Run VQL in both Node.js and modern web browsers.
- **Dynamic Variables**: Use predefined (`_me`, `_now`, `_user`) or custom variables in your queries for dynamic, context-aware operations.
- **Advanced Relation Queries**: Natively handle complex relationships not just between collections, but also across entire databases.
- **Permission System**: Built-in, granular access control powered by Gate Warden. It's disabled by default and can be enabled when needed to enforce complex security rules.
- **Configurable Behavior**: Customize VQL through `VQLConfig` -control permissions, field selection, path visibility, and more.
- **Falcon Frame Integration**: Integrates with Falcon Frame for extended HTTP API capabilities.

## Example Usage

Here is an example of how to use the `VQLProcessor` to execute a query:

```typescript
import VQLProcessor from "@wxn0brp/vql";
import { Valthera } from "@wxn0brp/db";

// Initialize database instances
const dbInstances = {
    myDatabase: new Valthera("path/to/database"),
};

// Create a VQLProcessor instance
const processor = new VQLProcessor(dbInstances);

// Define a query (VQLR)
const query = {
    db: "myDatabase",
    d: {
        find: {
            collection: "users",
            search: { $gt: { age: 18 } },
            select: { name: 1, age: 1 },
        },
    },
};

// Or you can use a string query (VQLS):
const vqls = `
myDatabase users
s.$gt.age = 18
e.name = 1
e.age = 1
`;

// Execute the query
(async () => {
    try {
        const result = await processor.execute(query);
        console.log("Query Result:", result);
    } catch (error) {
        console.error("Error executing query:", error);
    }
})();
```

## Development Tools

- [VQL-dev](https://github.com/wxn0brP/VQL-dev) - Debugging and development query tools.

## Documentation

- [wxn0brp.github.io/VQL](https://wxn0brp.github.io/VQL).

## License

MIT License.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## Powered by

- [ValtheraDB](https://github.com/wxn0brP/ValtheraDB)
- [Gate Warden](https://github.com/wxn0brP/gate-warden)
