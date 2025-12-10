# Core Concepts of VQL

## What is VQL?

VQL (Valthera Query Language) is not just a language; it"s a comprehensive framework for interacting with data stored in ValtheraDB. It provides a unified, secure, and flexible interface for querying and manipulating data, whether you are building a complex backend service or a dynamic front-end application.

At its heart, VQL is designed to be a powerful data processing engine. It combines a versatile query language, a robust permissions system, and a set of tools that work together to create a cohesive and efficient data environment.

## The Philosophy Behind VQL

VQL was built with several core goals in mind:

1.  **Unified & Centralized Data Access**: Provide a single, consistent way to interact with data across multiple databases. Instead of writing separate logic for each data source, you define it once in a VQL query.
2.  **Security as a Foundation**: Data security is critical. VQL integrates a granular, powerful permission system (Gate Warden) from the ground up. This allows developers to define complex access rules that are enforced automatically with every query, ensuring data is never exposed unintentionally. The system is optional and can be enabled when needed.
3.  **Flexibility for Every Use Case**: VQL offers two distinct syntaxes—**VQLR** (an object-based syntax for programmatic use) and **VQLS** (a simpler, human-readable string syntax). This duality allows developers to choose the right tool for the job, from complex application logic to simple scripts.
4.  **Harnessing the Power of Relations**: Modern applications are built on relationships between data. VQL is designed to understand and query these relationships natively, even across different databases, without the complex logic typically required.
5.  **Extensibility by Design**: No two applications are the same. VQL is built to be extensible through custom configurations and "sheets," allowing developers to tailor its functionality to their specific needs.

## Key Architectural Components

VQL"s architecture consists of several key components that work in concert:

### 1. The `VQLProcessor`

The `VQLProcessor` is the brain of the entire operation and the main entry point for all interactions. You initialize it with your database instances, and it handles the entire lifecycle of a query.

-   **Takes a query** (in either VQLR or VQLS format).
-   **Orchestrates** the validation, permission checks, execution, and response.
-   **Manages** the connection to one or more ValtheraDB instances.

### 2. The Query Languages: VQLR & VQLS

VQL provides two ways to write queries to suit different needs.

-   **VQLR (Runtime)**: A JSON-based object structure that serves as VQL"s internal AST format. It is ideal for building complex, dynamic queries programmatically within your application code. Its structured nature makes it easy to compose, modify, and integrate with type-safe languages like TypeScript. **[Learn more about VQLR](./lang/VQLR.md)**.

-   **VQLS (Simple)**: A human-readable, one-liner syntax designed for simplicity and speed. It"s perfect for CLI operations, configuration files, simple scripts, or any scenario where a developer or admin might write a query by hand. **[Learn more about VQLS](./lang/VQLS.md)**.

### 3. The Permission Engine

Security in VQL is designed to be both powerful and flexible. Instead of relying on static, schema-based rules, VQL employs a programmatic approach. This is achieved by passing a **Permission Validation Function (`permValidFn`)** to the `VQLProcessor`. This function is executed for every data access, giving you dynamic, fine-grained control.

To simplify the creation of this function, VQL provides the **`PermissionResolverEngine`**, a helper class for building sophisticated validation logic. You can add custom functions (resolvers) that grant or deny access based on data paths, user roles, or the data itself.

This system can also be integrated with **Gate Warden** to create a hybrid model, combining programmatic rules with a more traditional Role-Based Access Control (RBAC) system. **[Learn how to secure your data with VQL's permission system](./permissions.md)**.

### 4. ValtheraDB Adapters

The processor communicates with your databases via internal adapters. This abstraction is what allows VQL to seamlessly query across multiple database instances in a single request, treating them as a unified data pool.

## The Lifecycle of a Query

Understanding the flow of a query helps to see how these components fit together:

1.  **Query Creation**: Your application creates a query as either a VQLS string or a VQLR object. For TypeScript users, the `VQLUQ` type provides type-safety for either format.
2.  **Execution**: The query is sent to the `VQLProcessor`"s `.execute()` method, along with an optional user context for permission checks.
3.  **Parsing & Validation**: The processor parses the query (if VQLS) and validates its structure.
4.  **Permission Check**: If a `permValidFn` is configured, it is executed to authorize the request. It checks if the user has the right to access the requested data, potentially denying the query or redacting fields.
5.  **Data Retrieval**: The processor determines which database(s) and collection(s) to target and fetches the raw data from the relevant ValtheraDB instances.
6.  **Relational Processing**: VQL"s engine processes the results, performing any joins, filtering, or field selections. This is where the power of its relational model comes into play.
7.  **Response**: The final, processed data is returned to your application, containing only the information that the query requested and the user was permitted to see.

## Next Steps

Now that you understand the core concepts of VQL, you're ready to dive deeper.

-   **[Getting Started](getting_started.md):** Follow our hands-on tutorial to execute your first query.
-   **[VQLS Documentation](./lang/VQLS.md):** Master the simple and fast string-based syntax.
-   **[VQLR Documentation](./lang/VQLR.md):** Explore the powerful and programmatic object-based syntax.
-   **[Permissions Guide](permissions.md):** Learn how to implement robust, granular security for your data.
