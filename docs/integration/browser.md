# Browser Usage

A browser cannot open a filesystem-backed ValtheraDB. Run the `VQLProcessor` on a server and use `@wxn0brp/vql-client`, or embed the processor in the same origin and communicate over `BroadcastChannel`.

```typescript
import { fetchVQL, VConfig } from "@wxn0brp/vql-client";

VConfig.url = "http://localhost:48652/VQL";
VConfig.headers = { Authorization: "Bearer TOKEN" };

const users = await fetchVQL("main users s.status=$status", { status: "active" });
```

For the embedded setup, open a channel named `VQL`: send `{ type: "vql", data: { id, query } }` and receive `{ type: "vql-" + id, data: result }`. Adapters are listed with `{ type: "getAdapters" }`. This only works between same-origin pages.

The VQL-dev panel uses both modes: HTTP by default, or `?p=web` for the channel. See [VQL-dev/front](https://github.com/wxn0brP/VQL-dev) for a reference implementation.

For permission path hashing, the browser uses WebCrypto and produces the same SHA-256 hex digest as Node.js. Never ship database credentials or a permissive `permValidFn` in a browser bundle.
