# HTTP API Integration

Expose your `VQLProcessor` as an HTTP endpoint using [Falcon Frame](https://github.com/wxn0brP/falcon-frame).

## Server-Side: FF_VQL

```typescript
import { FalconFrame } from "@wxn0brp/falcon-frame";
import { VQLProcessor, FF_VQL } from "@wxn0brp/vql";
import { Valthera } from "@wxn0brp/db";

const db = new Valthera("./data/my-db");
const processor = new VQLProcessor({ main: db });

const app = new FalconFrame();

FF_VQL(app, processor);

app.l(3000);
```

### Options

```typescript
interface FF_VQL_Options {
  path?: string;         // Route path (default: "/VQL")
  getUser?: ContextFn;   // Extract user context from request
  getQuery?: GetQueryFn; // Custom query extraction
}
```

### User Context

```typescript
FF_VQL(app, processor, {
  getUser: async (req, res) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    const data = jwt.decode(token);
    if (data) {
      const dbUser = await db.findOne("users", { _id: data._id });
      return dbUser;
    }
    return { _id: "guest", role: "guest" };
  }
});
```

The returned object is passed to `processor.execute()` and available in [permission resolvers](./permissions.md).

### Custom Query Extraction

```typescript
FF_VQL(app, processor, {
  getQuery: async (req, res) => {
    const query = req.query.get("q");
    return query ? JSON.parse(query) : req.body.query;
  }
});
```

## createVqlRouteHandler

For more control over routing:

```typescript
import { createVqlRouteHandler } from "@wxn0brp/vql/helpers/falconFrame";

const handler = createVqlRouteHandler(processor, {
  getUser: async (req) => ({ _id: "user123" })
});

app.post("/custom-vql", handler);
```

## Response Format

**Success:**
```json
{ "err": false, "result": { /* data */ } }
```

**Error:**
```json
{ "err": true, "msg": "Error message", "c": 400 }
```

## Frontend: VQL Client

Use `@wxn0brp/vql-client` to communicate with the endpoint.

```bash
npm install @wxn0brp/vql-client
```

### Configuration

```typescript
import { VConfig } from "@wxn0brp/vql-client";

VConfig.url = "http://localhost:3000/VQL";
VConfig.headers = { "Authorization": "Bearer TOKEN" };
VConfig.body = {};  // Default body fields
VConfig.hookContext = {};  // Default hook context
```

### Usage

```typescript
import { fetchVQL, V } from "@wxn0brp/vql-client";

// VQLS with variables
const users = await fetchVQL(
  "mainDB users s.status=$status",
  { status: "active" }
);

// Tagged template literal
const item = await V`mainDB items! s._id="item-001"`;

// VQLR object
const result = await fetchVQL({
  db: "mainDB",
  d: { find: { collection: "users", search: { role: "admin" } } }
});

// With hook context and fetch options
const data = await fetchVQL(
  "mainDB users s.role=$role",
  { role: "admin" },  // vars
  { requestId: "123" },  // hookContext
  { signal: abortController.signal }  // fetchOptions
);
```

### Hooks

```typescript
VConfig.hooks = {
  onStart: (query, hookContext) => {
    console.log("Starting:", query);
  },
  onEnd: (query, durationMs, result, hookContext) => {
    console.log(`Completed in ${durationMs}ms:`, result);
  },
  onError: (query, error, result, hookContext) => {
    console.error("Failed:", error);
  }
};
```

### Custom Transport

```typescript
import { VConfig } from "@wxn0brp/vql-client";

VConfig.transport = async (query, fetchOptions) => {
  // Custom transport logic
  const res = await fetch("/custom-endpoint", {
    method: "POST",
    body: JSON.stringify({ query }),
    ...fetchOptions
  });
  return res.json();
};
```

### Browser/CDN Usage

When loaded via script tag, the client is available as `window.VQLClient`:

```javascript
VQLClient.cfg.url = "/api/vql";
const result = await VQLClient.fetchVQL("db users");
const item = await VQLClient.V`db items! s._id="123"`;
```
