# HTTP API Integration

Expose a `VQLProcessor` as an HTTP endpoint with [Falcon Frame](https://github.com/wxn0brP/falcon-frame).

## Server setup

```typescript
import { FalconFrame } from "@wxn0brp/falcon-frame";
import { VQLProcessor, VQLConfig, FF_VQL } from "@wxn0brp/vql";
import { ValtheraCreate } from "@wxn0brp/db";

const db = ValtheraCreate("./data/my-db");
const processor = new VQLProcessor(
    { main: db },
    new VQLConfig({ noCheckPermissions: false, strictSelect: true }),
    permValidFn
);

const app = new FalconFrame();

FF_VQL(app, processor);

app.l(3000);
```

`FF_VQL` registers a `POST` route. The default path is `/VQL`.

## Options

```typescript
FF_VQL(router, processor, {
    path: "/VQL",
    getUser: async (req, res) => user,
    getQuery: async (req, res) => query
});
```

| Option | Default | Description |
|--------|---------|-------------|
| `path` | `"/VQL"` | Route path |
| `getUser` | `() => ({})` | Build the user context from the request |
| `getQuery` | `req.body?.query` | Extract the query from the request |
| `dev` | ignored | Deprecated, has no effect |

The default context is `{}`. That is truthy, so `permissionDeniedIfNoUser` does not trigger, but no roles or ids are available. Always provide a real `getUser` for protected endpoints.

## Request format

By default the handler reads `req.body.query`:

```json
{
    "query": "main users s.status=\"active\" e.name=1"
}
```

The endpoint accepts VQLS strings only. A VQLR object passed as `query` is sent to the string parser and fails with `VQL_QUERY_PARSE`. Handle VQLR on the server, or add a custom route that calls `processor.execute` directly.

To send variables with a string query, return the wrapper from `getQuery`:

```typescript
FF_VQL(app, processor, {
    getQuery: async req => ({
        query: req.body.query,
        var: req.body.var
    })
});
```

Client request:

```json
{
    "query": "main users s.role=$role",
    "var": { "role": "admin" }
}
```

## User context

```typescript
FF_VQL(app, processor, {
    getUser: async (req, res) => {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) return null;

        const payload = verifyToken(token);  // your auth implementation
        const user = await db.findOne({ collection: "users", search: { _id: payload.sub } });
        return user;
    }
});
```

The returned object is passed to `processor.execute()` and is available in permission resolvers and in predefined variables (`$_me`, `$_user`).

Returning `null` triggers `permissionDeniedIfNoUser` when permissions are enabled. `undefined` is replaced by `execute()` with the placeholder `{ _id: "null-null-null" }` and continues with a fake identity, so return `null` for anonymous requests.

## Custom query extraction

```typescript
FF_VQL(app, processor, {
    getQuery: async req => {
        const query = req.query.q;
        return query ? JSON.parse(query) : req.body.query;
    }
});
```

## Custom routing

For more control, use the handler directly:

```typescript
import { createVqlRouteHandler } from "@wxn0brp/vql/helpers/falconFrame";

const handler = createVqlRouteHandler(processor, {
    getUser: async req => ({ _id: "user123" })
});

app.post("/custom-vql", handler);
```

## Response format

**Success**

```json
{
    "err": false,
    "result": { }
}
```

**Error**

```json
{
    "err": true,
    "msg": "Permission denied: operation not permitted",
    "c": 403,
    "code": "VQL_PERMISSION_DENIED",
    "suggestion": "Check permissions for the user and collection",
    "context": { "reason": "operation not permitted" }
}
```

`suggestion` and `context` appear only when the error provides them.

The HTTP status is set from `VQLError.statusCode`. Unexpected errors are wrapped by `wrapAdapterError` and returned with status `500`.

| Status | Typical cause |
|--------|---------------|
| 400 | Parse or validation error, unknown database, invalid relation |
| 403 | Permission denied |
| 500 | Invalid config, unknown operation, unexpected failure |
| 501 | Missing adapter handler |

## Authentication notes

- The integration does not implement authentication. `getUser` is the hook.
- The route does not add CORS headers. Configure them in Falcon Frame if the client runs on a different origin.
- Do not expose `noCheckPermissions: true` publicly. It grants full database access to anyone who can reach the endpoint.
- Return a stable user shape with `_id` (or `id`) so Gate Warden and built-in variables work.

## Frontend client

The companion client is `@wxn0brp/vql-client`.

```bash
npm install @wxn0brp/vql-client
```

### Configuration

```typescript
import { VConfig } from "@wxn0brp/vql-client";

VConfig.url = "http://localhost:3000/VQL";
VConfig.headers = { Authorization: "Bearer TOKEN" };
VConfig.body = {};
VConfig.hookContext = {};
```

### Usage

```typescript
import { fetchVQL, V } from "@wxn0brp/vql-client";

// VQLS with variables
const users = await fetchVQL(
    "main users s.status=$status",
    { status: "active" }
);

// Tagged template
const item = await V`main items! s._id="item-001"`;

// VQLR object, only with a server that accepts objects
// (FF_VQL expects a VQLS string)
const result = await fetchVQL({
    db: "main",
    d: { find: { collection: "users", search: { role: "admin" } } }
});

// Hook context and fetch options
const data = await fetchVQL(
    "main users s.role=$role",
    { role: "admin" },
    { requestId: "123" },
    { signal: abortController.signal }
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

### Custom transport

```typescript
import { VConfig } from "@wxn0brp/vql-client";

VConfig.transport = async (query, fetchOptions) => {
    const res = await fetch("/custom-endpoint", {
        method: "POST",
        body: JSON.stringify({ query }),
        ...fetchOptions
    });
    return res.json();
};
```

### Browser global

When loaded with a script tag, the client is available as `window.VQLClient`:

```javascript
VQLClient.cfg.url = "/api/vql";
const result = await VQLClient.fetchVQL("main users");
const item = await VQLClient.VQL`main items! s._id="123"`;
```

## Next steps

- [Permissions](../core/permissions.md)
- [Errors](../core/errors.md)
- [Browser Usage](./browser.md)
