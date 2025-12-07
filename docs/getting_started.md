# Getting Started: Your First VQL Query

Welcome to the VQL Getting Started guide! This tutorial will walk you through the essential steps to set up VQL, connect it to your ValtheraDB instances, and execute your first queries using both VQLR (Runtime) and VQLS (Simple) syntaxes.

By the end of this guide, you will be able to:

-   Install VQL in your project.
-   Initialize the `VQLProcessor`.
-   Perform basic `find` operations with VQLR and VQLS.
-   Understand the structure of VQL queries.

## Prerequisites

Before you begin, ensure you have:
-   Node.js (or preferably Bun) installed.
-   A basic understanding of TypeScript/JavaScript.
-   [`ValtheraDB`](https://github.com/wxn0brP/ValtheraDB) installed and know how to initialize a database instance. You can find its documentation [here](https://wxn0brp.github.io/ValtheraDB/).

```bash
# Install ValtheraDB if you haven't already
npm install @wxn0brp/db # or yarn add @wxn0brp/db, bun add @wxn0brp/db
```

## Step 1: Install VQL

First, add VQL to your project's dependencies:

```bash
# Using npm
npm install @wxn0brp/vql

# Or using yarn
yarn add @wxn0brp/vql

# Or using bun
bun add @wxn0brp/vql
```

## Step 2: Initialize ValtheraDB and VQLProcessor

VQL operates on one or more instances of ValtheraDB. Let's create a couple of sample databases and then initialize the `VQLProcessor`.

Create a file named `your-first-query.ts`:

```typescript
import VQLProcessor, { VQLUQ } from "@wxn0brp/vql";
import { Valthera } from "@wxn0brp/db";

// 1. Initialize ValtheraDB instances
// Ensure these paths are valid for your environment.
// ValtheraDB will create these directories if they don't exist.
const userDb = new Valthera("./data/users-db");
const productDb = new Valthera("./data/products-db");

// You can add some initial data to your databases
async function setupData() {
  await userDb.add("users", { _id: "user1", name: "Alice", email: "alice@example.com", age: 30 });
  await userDb.add("users", { _id: "user2", name: "Bob", email: "bob@example.com", age: 25 });
  await productDb.add("items", { _id: "item1", name: "Laptop", price: 1200, stock: 10 });
  await productDb.add("items", { _id: "item2", name: "Mouse", price: 25, stock: 50 });
  console.log("Sample data added to ValtheraDB instances.");
}

// 2. Map your database instances to logical names for VQL
const dbInstances = {
  users: userDb,
  products: productDb,
};

// 3. Create a VQLProcessor instance
const processor = new VQLProcessor(dbInstances);

console.log("VQL Processor initialized and ready!");

// Call setupData() before running queries
setupData().catch(console.error);

```

To run this setup, we recommend using `bun` as it handles TypeScript execution out of the box without a separate compilation step:

```bash
# In your terminal, run the script directly with bun
bun run your-first-query.ts
```

Alternatively, you can use `ts-node` or compile with `tsc` and run with `node`:

```bash
# Using ts-node
ts-node your-first-query.ts

# Or compile and run with node
tsc your-first-query.ts
node your-first-query.js
```

You should see "Sample data added to ValtheraDB instances." and "VQL Processor initialized and ready!" in your console. Two directories (`data/users-db` and `data/products-db`) will also be created with your data.

## Step 3: Executing Your First VQLR Query (Object Syntax)

VQLR is the JSON-based object syntax, often used when constructing queries programmatically. Let's find all users from our `users` database.

For TypeScript users, VQL exports the `VQLUQ<T>` type, which represents a union of both VQLS (string) and VQLR (object) formats. Using this type provides type-checking and autocompletion for your VQLR queries.

Add the following to `your-first-query.ts`:

```typescript
// ... (previous code for VQLProcessor initialization and setupData) ...

async function runVQLRQuery() {
  // Wait for data setup to complete
  await setupData();

  const queryVQLR: VQLUQ = {
    db: "users", // Target the 'users' database instance
    d: {
      find: { // This is the operation type
        collection: "users", // Target the 'users' collection within the 'users' db
        search: { $gt: { age: 20 } }, // Find users where age is greater than 20
        fields: { name: 1, email: 1 } // Select only 'name' and 'email' fields
      },
    },
  };

  try {
    console.log("\nExecuting VQLR query...");
    const result = await processor.execute(queryVQLR);
    console.log("VQLR Query Result:", result);
  } catch (error) {
    console.error("Error executing VQLR query:", error);
  }
}

// Run the VQLR query
runVQLRQuery().catch(console.error);
```

Expected Output for the VQLR query:

```json
{
  "users": [
    { "name": "Alice", "email": "alice@example.com" },
    { "name": "Bob", "email": "bob@example.com" }
  ]
}
```

## Step 4: Executing Your First VQLS Query (String Syntax)

VQLS is the simple, string-based syntax, great for quick queries or CLI tools. When an operation like `find` is not specified, it is used by default. Let's find all products from our `products` database with a price less than 100.

Add the following to `your-first-query.ts`:

```typescript
// ... (previous code for VQLProcessor initialization, setupData, and runVQLRQuery) ...

async function runVQLSQuery() {
  // Wait for data setup to complete
  await setupData(); // Ensure data is set up before running

  // VQLS for finding products with price < 100.
  // 'find' is the default operation if none is specified.
  const queryVQLS: VQLUQ = `products items s.$lt.price=100 f.name=1 f.price=1`;

  try {
    console.log("\nExecuting VQLS query...");
    const result = await processor.execute(queryVQLS);
    console.log("VQLS Query Result:", result);
  } catch (error) {
    console.error("Error executing VQLS query:", error);
  }
}

// Run the VQLS query
runVQLSQuery().catch(console.error);
```

Expected Output for the VQLS query:

```json
{
  "items": [
    { "name": "Mouse", "price": 25 }
  ]
}
```

## Step 5: Modifying Data with VQLS

VQLS also provides a concise syntax for data modification. Let's update the stock of our "Mouse" item from 50 to 45 using the `~!` (updateOne) operator.

Add the following to `your-first-query.ts`:

```typescript
async function runVQLSUpdateQuery() {
    // Wait for data setup to complete
    await setupData();

    // VQLS for updating a single item.
    // Syntax: <db> ~<collection>~ s.<field>=<val> u.<field>=<val>
    const updateQuery: VQLUQ = `products ~items! s.name="Mouse" u.stock=45`;

    try {
        console.log("\nExecuting VQLS update query...");
        const result = await processor.execute(updateQuery);
        console.log("VQLS Update Result:", result);

        // Optional: Verify the change by fetching the updated item
        const verifyResult = await processor.execute(`products items s.name="Mouse"`);
        console.log("Verified Item:", verifyResult);

    } catch (error) {
        console.error("Error executing VQLS update query:", error);
    }
}

// Run the VQLS update query
runVQLSUpdateQuery().catch(console.error);
```

The `u.` prefix stands for `update`, specifying the fields to change. The `s.` prefix works just like in a `find` query, specifying which document to target.

Expected output for the update and verification:

```json
// VQLS Update Result: (output may vary, but indicates success)
{ "updated": 1 }

// Verified Item:
{ "items": [ { "_id": "item2", "name": "Mouse", "price": 25, "stock": 45 } ] }
```

## Congratulations!

You've successfully set up VQL and executed your first queries using both VQLR and VQLS. You're now ready to explore more advanced features.

### Next Steps

-   Learn about the fundamental concepts of VQL in **[Core Concepts](core_concepts.md)**.
-   Deep dive into the specific syntax of **[VQLS](./lang/VQLS.md)** and **[VQLR](./lang/VQLR.md)**.
-   Understand how to manage access control with VQL's **[Permissions](permissions.md)**.

