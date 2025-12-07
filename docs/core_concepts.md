# Core Concepts of VQL

Understanding VQL revolves around a few fundamental ideas that collectively enable its powerful data interaction capabilities. This section will delve into the primary components: the `VQLProcessor`, the dual nature of `VQLR` and `VQLS` queries, and how VQL handles relations and permissions.

## The VQLProcessor: The Central Engine

At the heart of VQL is the `VQLProcessor`. This is the main class responsible for orchestrating all VQL operations. It acts as an intermediary between your application and your `ValtheraDB` instances.

The `VQLProcessor` takes your VQL query (either VQLR or VQLS), parses it, applies any configured permissions, resolves relations, and then executes the necessary operations against the specified `ValtheraDB` instances via their respective adapters.

**Key Responsibilities of `VQLProcessor`:**

-   **Query Parsing & Validation:** Interprets both VQLR objects and VQLS strings into an internal Abstract Syntax Tree (AST).
-   **Database Orchestration:** Manages multiple `ValtheraDB` instances, routing queries to the correct database.
-   **Relation Resolution:** Automatically fetches and merges related data as defined in the query or processor configuration.
-   **Permission Enforcement:** Applies `Gate Warden` rules to ensure data access complies with defined security policies.
-   **Variable Management:** Processes and substitutes variables within queries for dynamic execution.

### Initialization

The `VQLProcessor` is initialized by providing it with a map of named `ValtheraDB` instances:

```typescript
import VQLProcessor from "@wxn0brp/vql";
import { Valthera } from "@wxn0brp/db";

const myUserDb = new Valthera("./data/my-users-db");
const myProductDb = new Valthera("./data/my-products-db");

const processor = new VQLProcessor({
  users: myUserDb,     // 'users' is a logical name for this DB instance
  products: myProductDb // 'products' is a logical name for this DB instance
});
```

## VQLR (Runtime) vs. VQLS (Simple): Dual Query Syntaxes

VQL offers two distinct syntaxes to cater to different use cases. Both ultimately translate into an internal representation that the `VQLProcessor` understands and executes.

### VQLR (Runtime Query Language)

-   **Nature:** JSON-based object structure.
-   **Best For:** Programmatic query construction, complex nested queries, dynamic query generation, direct engine interaction.
-   **Advantages:**
    -   Offers full control over every aspect of the query.
    -   Naturally integrates with TypeScript/JavaScript objects, allowing for strong typing and autocompletion.
    -   Ideal for building APIs where queries are constructed in code.
-   **Example (Find a user by ID and their posts):**
    ```typescript
    const vqlrQuery = {
      db: "users",
      d: {
        findOne: {
          collection: "users",
          search: { _id: "user123" },
          relations: {
            posts: {
              path: ["postsDb", "posts"], // Assuming 'postsDb' is another ValtheraDB instance
              search: { status: "published" },
              select: ["title", "content"]
            }
          }
        }
      }
    };
    ```
-   **Detailed Documentation:** Refer to [VQLR](./lang/VQLR.md)

### VQLS (Simple Query Language)

-   **Nature:** Single-line, human-readable string syntax.
-   **Best For:** CLI tools, quick ad-hoc queries, logging, simpler scripts, configurations.
-   **Advantages:**
    -   Highly concise and easy to type.
    -   Human-readable, making it suitable for non-developers or command-line interfaces.
    -   Excellent for defining simple operations.
-   **Example (Find active products priced under 50):**
    ```typescript
    const vqlsQuery = `
      products find items
      s.$lt.price=50
      s.status="active"
      f.name=1 f.price=1
    `;
    ```
-   **Detailed Documentation:** Refer to [VQLS](./lang/VQLS.md)

## Relations: Connecting Your Data

VQL excels at handling complex data relationships, not just within a single database but *across multiple `ValtheraDB` instances*. Unlike a static configuration, relations in VQL are defined **dynamically within the query itself**, using the top-level `r` key in a VQLR query. This approach provides maximum flexibility, allowing for ad-hoc and complex data fetching without pre-defining every possible relationship.

VQL uses the powerful, battle-tested relation engine from `ValtheraDB` under the hood. When the processor detects an `r` key in a query, it passes the query to the `executeRelation` engine, which fetches and merges the related data as defined in the query.

### Example of a Relation Query

This query finds orders and, for each order, resolves the related customer from a different database and the associated product items.

```typescript
const vqlrRelationQuery: VQLUQ = {
  r: {
    path: ["ordersDb", "orders"], // The root collection to query
    search: { status: "shipped" },
    relations: {
      // "customer" becomes a new field in the results
      customer: {
        path: ["usersDb", "users"], // The related collection in another DB
        fk: "customerId",
        pk: "_id",
        type: "1" // One-to-one relation
      },
      // "items" becomes a new field in the results
      items: {
        path: ["productsDb", "products"], // Another related collection
        fk: "productIds", // Assumes order.productIds is an array of IDs
        pk: "_id",
        type: "1n" // One-to-many relation
      }
    }
  }
};
```

This declarative, in-query approach eliminates the need for manual "joins" in your application logic and allows for fetching deeply nested or cross-database data in a single, predictable operation.

## Permissions: Secure by Design

Security is a first-class citizen in VQL. Instead of a schema-based directive system, VQL uses a far more powerful and flexible programmatic approach based on a **Permission Validation Function (`permValidFn`)**. This function is provided to the `VQLProcessor` during its construction.

At its core, every time VQL tries to access a data field, it calls the `permValidFn` you provided, asking "Is access to this field allowed for this user?". This gives you absolute control over your data security logic.

### The `PermissionResolverEngine`

To make creating the `permValidFn` easier, VQL provides the `PermissionResolverEngine`. This engine allows you to register custom **resolver functions** that are matched against specific data paths.

**Key Concepts of VQL Permissions:**
-   **Path-Based Matching:** Resolvers are triggered based on the path of the data being accessed (e.g., `users/email`). You can use strings, Regular Expressions, or even custom functions for matching.
-   **Custom Logic:** Your resolver function receives a context object (with your user data) and details about the field being accessed, allowing for any custom logic you need.
-   **`Gate Warden` Integration:** The engine can be configured to use a `GateWarden` instance as a fallback, allowing you to combine flexible, path-based rules with a more traditional role-based access control (RBAC) system.

### How It Works

1.  You create an instance of `PermissionResolverEngine`.
2.  You use `.addResolver()` to add your custom logic for specific paths.
3.  You generate the final `permValidFn` using `.create()` or `.createWithGw()`.
4.  You pass this function to the `VQLProcessor` constructor.

```typescript
// Example of building a permValidFn
import { PermissionResolverEngine } from "@wxn0brp/vql";

const resolverEngine = new PermissionResolverEngine();

// Add a resolver for any field named "email"
resolverEngine.addResolver(/email$/, async (args) => {
    // Only admins or the owner can see the email
    return args.user.role === 'admin' || args.user.id === args.rootData._id;
});

// Create the validation function
const myPermValidFn = resolverEngine.create();

// Pass it to the VQL processor
const processor = new VQLProcessor(dbInstances, new VQLConfig(), myPermValidFn);
```

This system provides a highly dynamic and powerful way to secure your data, as the logic is decoupled from the queries and schemas themselves. For a detailed guide, see the **[Permissions](permissions.md)** page.

By understanding these core concepts – the `VQLProcessor` as your central hub, the distinct roles of `VQLR` and `VQLS`, and VQL's robust handling of relations and permissions – you are well-equipped to leverage the full power of VQL for your data-driven applications.

### Next Steps

-   Explore the full capabilities of **[VQLS](./lang/VQLS.md)** for concise queries.
-   Master the comprehensive structure of **[VQLR](./lang/VQLR.md)** for programmatic control.
-   Deep dive into implementing advanced security with **[Permissions](permissions.md)**.
