# Permissions

VQL has an optional programmatic permission system. **Disabled by default.**

## Enabling Permissions

```typescript
import VQLProcessor, { VQLConfig } from "@wxn0brp/vql";

const processor = new VQLProcessor(
  dbInstances,
  new VQLConfig({
    noCheckPermissions: false,
    // recommended
    strictSelect: true,
    strictACL: true,
  }),
  permValidFn
);
```

## Permission Validation Function

```typescript
type PermValidFn = (args: PermValidFnArgs) => Promise<ValidFnResult>;

interface PermValidFnArgs {
  field: string;    // Path (hashed if hidePath: true)
  path: string[];   // Original path segments
  p: number;        // CRUD bitmask
  user: any;        // User context from execute()
}

interface ValidFnResult {
  granted: boolean;
  via?: "resolver" | "gate-warden";
  reason?: string;
}
```

### CRUD Levels

```typescript
import { PermCRUD } from "@wxn0brp/vql/types/perm";

enum PermCRUD {
  CREATE = 1,
  READ = 2,
  UPDATE = 4,
  DELETE = 8,
  COLLECTION = 16
}
```

## PermissionResolverEngine

Helper for building `permValidFn` with path-based resolvers.

```typescript
import { PermissionResolverEngine } from "@wxn0brp/vql/permissions/resolver";

const engine = new PermissionResolverEngine();

// Block passwords
engine.addResolver("password", async () => false, "endsWith");

// Allow admins
engine.addResolver("users", async (args) => args.user?.role === "admin", "startsWith");

const permValidFn = engine.create();
```

### Matchers

| Type | Example | Description |
|------|---------|-------------|
| `string` | `"users/email"` | Path matching (configurable mode) |
| `RegExp` | `/password$/` | Pattern matching |
| `function` | `(path, segments) => boolean` | Custom logic |

### String Matcher Modes

```typescript
engine.addResolver("password", resolver, "endsWith");    // users/password
engine.addResolver("users/", resolver, "startsWith");    // users/email
engine.addResolver("secret", resolver, "includes");      // config/secret_key
engine.addResolver("users/email", resolver);             // exact (default)
```

### Resolver Function

```typescript
engine.addResolver("users/email", async (args) => {
  if (args.user?.role === "admin") return true;
  if (args.user?._id === args.path[1]) return true;  // own record
  if (args.p & PermCRUD.READ) return true;
  return false;
});
```

### Creating Permission Function

```typescript
// Custom resolvers only (unmatched = denied)
const permValidFn = engine.create();

// Fall back to Gate Warden if no match
import { GateWarden } from "@wxn0brp/gate-warden";
const gw = new GateWarden();
const permValidFn = engine.createWithGw(gw);
```

## createGwValidFn

Simpler Gate Warden integration without custom resolvers:

```typescript
import { createGwValidFn } from "@wxn0brp/vql";
import { GateWarden } from "@wxn0brp/gate-warden";

const gw = new GateWarden();
const permValidFn = createGwValidFn(gw);
```

## Complete Example

```typescript
import VQLProcessor, { VQLConfig } from "@wxn0brp/vql";
import { PermissionResolverEngine } from "@wxn0brp/vql/permissions/resolver";
import { GateWarden } from "@wxn0brp/gate-warden";

const gw = new GateWarden();
gw.addRole("admin", ["users.*", "posts.*"]);
gw.addRole("user", ["posts.read"]);

const engine = new PermissionResolverEngine();
engine.addResolver("password", async () => false, "endsWith");
engine.addResolver("", async (args) => args.user?.role === "admin");

const permValidFn = engine.createWithGw(gw);

const processor = new VQLProcessor(
  dbInstances,
  new VQLConfig({ noCheckPermissions: false }),
  permValidFn
);

const result = await processor.execute(query, { _id: "user123", role: "user" });
```
