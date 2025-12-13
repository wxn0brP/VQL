# Permissions in VQL

VQL implements a highly flexible and powerful programmatic permission system. Instead of static rules defined in a schema, VQL allows you to inject a **Permission Validation Function (`permValidFn`)** directly into the `VQLProcessor`. This function is called for every field being accessed, giving you fine-grained, dynamic control over your data security.

To simplify the creation of this validation function, VQL provides the `PermissionResolverEngine`.

## `PermissionResolverEngine`: The Core of Custom Logic

The `PermissionResolverEngine` is a helper class that lets you build a sophisticated `permValidFn` by registering custom resolver functions that are matched against data access paths.

### How It Works

1.  **Instantiate the Engine:** Create a new `PermissionResolverEngine`.
2.  **Add Resolvers:** Use the `.addResolver()` method to register your permission logic. Each resolver is paired with a `matcher` that determines when it should be executed.
3.  **Generate the Validation Function:** Use the engine's `.create()` or `.createWithGw()` method to generate the final `permValidFn`.
4.  **Inject into VQLProcessor:** Pass the generated function to the `VQLProcessor`'s constructor.

## Step 1: Creating the `PermissionResolverEngine`

First, import and create an instance of the engine.

```typescript
import { PermissionResolverEngine } from "@wxn0brp/vql";

const resolverEngine = new PermissionResolverEngine();
```

## Step 2: Adding Resolvers

This is where you define your security logic. The `.addResolver()` method takes a `matcher`, a `resolver` function, and optional `opts` for advanced matching.

### Matchers

A `matcher` tells the engine which data paths the resolver should apply to. The path is a string like `collection/field` (e.g., `users/email`). A matcher can be:

-   A **string:** For path matching with configurable mode (exact match by default). See options below.
-   A **RegExp:** For pattern-based matching (e.g., `/email$/` to match any field ending in "email").
-   A **function:** For complex, dynamic matching logic `(pathString: string, pathArray: string[]) => boolean`.

### Options for String Matchers

When using a string matcher, you can specify different matching behaviors with the optional `opts` parameter:

-   `"endsWith"`: Matches if the path ends with the string (e.g., `"email"` matches `users/email`, `accounts/primaryEmail`)
-   `"startsWith"`: Matches if the path starts with the string (e.g., `"users/"` matches `users/email`, `users/name`)
-   `"includes"`: Matches if the path contains the string (e.g., `"secret"` matches `private/secret/data`, `admin/config/secret_key`)
-   `"exact"` (default): Matches only when the path is exactly equal to the string

### Resolver Function

A `resolver` is an `async` function that returns `true` (access granted) or `false` (access denied). It receives a `PermValidFnArgs` object with the following properties:

-   `user`: The user object passed to `processor.execute()`.
-   `path`: The current data path as an array of strings.
-   `field`: The specific field being accessed.
-   `rootData`: The complete data object for the current record being processed.
-   `p`: The permission arguments from the query (if any).

### Example: Adding Different Resolvers

```typescript
// Resolver 1: Block access to any field ending with 'password' using string mode
resolverEngine.addResolver("password", async (args) => {
    // This resolver simply denies access, no matter who the user is.
    return false;
}, { stringMode: "endsWith" });

// Resolver 2: Block access to any field containing 'secret' using string mode
resolverEngine.addResolver("secret", async (args) => {
    return false;
}, "includes"); // shorthand notation

// Resolver 3: Block access to fields that match a RegExp pattern
resolverEngine.addResolver(/password$/, async (args) => {
    return false;
});

// Resolver 4: Restrict access to the 'email' field using exact string matching
resolverEngine.addResolver("users/email", async (args) => {
    // Logic: Allow if the user is an admin OR if they are requesting their own email.
    const { user, rootData } = args;
    if (user.role === 'admin') {
        return true;
    }
    if (user.id === rootData._id) {
        return true;
    }
    return false;
});

// Resolver 5: A function-based matcher for any field in a 'logs' collection
const logsMatcher = (pathString, pathArray) => pathString.startsWith('logs/');
resolverEngine.addResolver(logsMatcher, async (args) => {
    // Logic: Only admins can access anything in the logs.
    return args.user.role === 'admin';
});
```

## Step 3: Generating the `permValidFn`

The engine can generate the final validation function in two ways.

### `create()`

This method creates a `permValidFn` that uses *only* the custom resolvers you added.

```typescript
const customPermValidFn = resolverEngine.create();
```

If a data path is accessed that does not match any of your resolvers, access will be **denied** (`granted: false, via: 'no-resolver-match'`).

### `createWithGw(gateWardenInstance)`

This method creates a `permValidFn` that first tries your custom resolvers. If no resolver matches a path, it falls back to a `GateWarden` instance. This is perfect for combining dynamic, path-based rules with a more traditional Role-Based Access Control (RBAC) system.

```typescript
import { GateWarden } from "@wxn0brp/gate-warden";

// Assume 'gw' is a fully configured GateWarden instance
const gw = new GateWarden();
// ... add roles and permissions to gw ...

// Create a validation function that uses custom resolvers and falls back to GateWarden
const combinedPermValidFn = resolverEngine.createWithGw(gw);
```

## Step 4: Initializing `VQLProcessor`

Finally, pass your generated `permValidFn` to the `VQLProcessor` constructor.

```typescript
import { VQLProcessor, VQLConfig } from "@wxn0brp/vql";

// Assume dbInstances and a permValidFn are created
const processor = new VQLProcessor(
    dbInstances,
    new VQLConfig(), // Optional config
    combinedPermValidFn // Your generated permission function
);

// Now, all calls to processor.execute() will be protected by your rules
async function runQuery() {
    const userContext = { id: 'user123', role: 'editor' };
    const query = /* ... your VQLR or VQLS query ... */;

    // The 'userContext' will be available inside your permission resolvers
    const result = await processor.execute(query, userContext);

    console.log(result);
}
```

This programmatic approach provides a robust and highly adaptable security model, allowing you to define complex rules that are decoupled from your query logic and schemas.
