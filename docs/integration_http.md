# HTTP API Integration

VQL is designed to work seamlessly not just within a single application, but also across network boundaries. You can easily expose your `VQLProcessor` as an HTTP endpoint, allowing frontend applications, microservices, or external scripts to execute queries securely and efficiently.

This guide outlines the recommended way to create a VQL-powered API using [Falcon Frame](https://github.com/wxn0brP/falcon-frame) on the backend and a lightweight VQL client on the frontend.

## Server-Side: Exposing VQL with `FF_VQL`

The `FF_VQL` helper function is the quickest way to create a dedicated VQL endpoint. It handles incoming requests, passes them to the `VQLProcessor`, and returns the results in a standardized format.

### Basic Setup

Here is an example of a simple web server that exposes a VQL endpoint.

**`server.ts`**
```typescript
import { FalconFrame } from "@wxn0brp/falcon-frame";
import { VQLProcessor, FF_VQL } from "@wxn0brp/vql";
import { Valthera } from "@wxn0brp/db";

// 1. Initialize your Database and VQLProcessor
const db = new Valthera("./data/my-db");
const processor = new VQLProcessor({ mainDB: db });

// 2. Initialize Falcon Frame
const app = new FalconFrame();

// 3. Add the VQL endpoint using the helper
FF_VQL(app, processor, {
    // These options are optional
    path: "/vql-api", // Default is "/VQL"
    dev: true // Enables a GET endpoint for debugging queries
});

// 4. Start the server
app.l(3000);
```

### Passing User Context

A critical feature of `FF_VQL` is the ability to extract user context from each request and pass it to the `VQLProcessor` for permission checks. This is done via the `getUser` option.

```typescript
FF_VQL(app, processor, {
    getUser: async (req) => {
        // Example: Extract user info from an Authorization header
        const token = req.headers.get("Authorization")?.replace("Bearer ", "");
        
        if (token === "SECRET_ADMIN_TOKEN") {
            return { _id: "admin-user", role: "admin" };
        }
        
        // For permission resolvers, it's important to provide a context
        return { _id: "guest-user", role: "guest" };
    }
});
```
The object returned by `getUser` is passed as the `user` argument to `processor.execute()` and is available within your [permission resolvers](./permissions.md).

## Frontend: Using a VQL Client

To communicate with the VQL endpoint from a browser or another service, you should use the official **`@wxn0brp/vql-client`** library. This client simplifies interaction with your VQL API, providing convenient functions for sending queries and managing configuration.

### Installation

Install the `@wxn0brp/vql-client` package in your frontend project:

```bash
npm install @wxn0brp/vql-client
# or yarn add @wxn0brp/vql-client
# or bun add @wxn0brp/vql-client
```

### Core Client Functions

The `@wxn0brp/vql-client` package exports the following key functions and objects:

-   `VQLClient.fetchVQL(query, vars)`: The primary function for sending queries to the VQL API.
    -   `query`: Can be a VQLS string or a VQLR object. If a string, variables can be provided separately.
    -   `vars` (optional): An object containing variables to be substituted in the query (e.g., for `s.age=$age`).
-   `VQLClient.V`: A tagged template literal for a more ergonomic, inline VQLS query syntax directly within your code. It's a convenient wrapper around `VQLClient.fetchVQL`.
-   `VQLClient.cfg`: A global configuration object allowing you to set the endpoint URL (`VQLClient.cfg.url`), default HTTP headers (`VQLClient.cfg.headers`), and other options for all client requests.
-   `VQLClient.defTransport`: The default transport function used for making HTTP requests. You can override this for custom networking logic.
-   `VQLClient.VQLHooks`: An interface for defining hooks that can run before, after, or on error of a VQL request. You can set `VQLClient.cfg.hooks`.

### Example Usage

Here’s how you might use the `@wxn0brp/vql-client` in your frontend JavaScript or TypeScript code.

```typescript
import { VQLClient } from "@wxn0brp/vql-client";

// Configure the client to point to your API endpoint
VQLClient.cfg.url = "http://localhost:3000/vql-api";

// Set a default header for authorization
VQLClient.cfg.headers = {
    "Authorization": "Bearer SECRET_ADMIN_TOKEN"
};

async function loadData() {
    try {
        // Example 1: Use fetchVQL with variables
        console.log("Fetching active users...");
        const activeUsers = await VQLClient.fetchVQL("mainDB users s.status=$status", { status: "active" });
        console.log("Active Users:", activeUsers);

        // Example 2: Use the V template literal for a simple query
        console.log("Fetching item by ID...");
        const item = await VQLClient.V`mainDB items! s._id="item-001"`;
        console.log("Item:", item);

    } catch (e) {
        console.error("An error occurred while fetching VQL data:", e);
    }
}

loadData();
```

This client-server combination provides a powerful, secure, and maintainable way to build modern data-driven applications with VQL. The server exposes the full power of VQL through a single endpoint, while the client offers a simple and pleasant developer experience for consuming it.
