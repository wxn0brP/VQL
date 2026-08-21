import { VQLConfig } from "#helpers/config";
import {
	checkRequestPermission,
	extractPaths,
	filterObjectByPermissions,
	filterObjectsByPermissions,
	processFieldPath,
} from "#permissions/request";
import { PermCRUD, PermValidFn } from "#types/perm";
import { VQL_Query_CRUD } from "#types/vql";
import { describe, expect, it } from "bun:test";

describe("Permissions/Request", () => {
    const config = new VQLConfig();
    const user = { _id: "test_user" };

    describe("processFieldPath", () => {
        it("1. should process simple field path correctly", () => {
            const pathObj = { path: ["users"], key: "name" };
            const result = processFieldPath(pathObj);
            expect(result).toEqual(["users", "name"]);
        });

        it("2. should handle subset mode correctly", () => {
            const pathObj = { path: ["users", "$subset", "profile"], key: "email" };
            const result = processFieldPath(pathObj);
            expect(result).toEqual(["users", "profile", "email"]);
        });

        it("3. should skip keys that start with $", () => {
            const pathObj = { path: ["users"], key: "$or" };
            const result = processFieldPath(pathObj);
            expect(result).toEqual(["users"]);
        });

        it("4. should handle nested paths without subset", () => {
            const pathObj = { path: ["posts", "author"], key: "name" };
            const result = processFieldPath(pathObj);
            expect(result).toEqual(["posts", "author", "name"]);
        });
    });

    describe("extractPaths", () => {
        it("1. should extract paths for find operation", async () => {
            const query: VQL_Query_CRUD = {
                db: "test_db",
                d: {
                    find: {
                        collection: "users",
                        search: { name: "john" }
                    }
                }
            };

            const result = await extractPaths(config, query);

            expect(result.db).toBeDefined();
            expect(result.c).toBe("users");
            expect(result.paths).toContainEqual(expect.objectContaining({
                p: PermCRUD.READ
            }));
        });

        it("2. should extract paths for findOne operation", async () => {
            const query: VQL_Query_CRUD = {
                db: "test_db",
                d: {
                    findOne: {
                        collection: "users",
                        search: { name: "john" }
                    }
                }
            };

            const result = await extractPaths(config, query);

            expect(result.db).toBeDefined();
            expect(result.c).toBe("users");
            expect(result.paths).toContainEqual(expect.objectContaining({
                p: PermCRUD.READ
            }));
        });

        it("3. should extract paths for find alias (f) operation", async () => {
            const query: VQL_Query_CRUD = {
                db: "test_db",
                d: {
                    f: {
                        collection: "users",
                        search: { name: "john" }
                    }
                }
            };

            const result = await extractPaths(config, query);

            expect(result.db).toBeDefined();
            expect(result.c).toBe("users");
            expect(result.paths).toContainEqual(expect.objectContaining({
                p: PermCRUD.READ
            }));
        });

        it("4. should extract collection permission for add operation", async () => {
            const query: VQL_Query_CRUD = {
                db: "test_db",
                d: {
                    add: {
                        collection: "users",
                        data: { name: "john" }
                    }
                }
            };

            const result = await extractPaths(config, query);

            expect(result.db).toBeDefined();
            expect(result.c).toBe("users");
            expect(result.paths).toContainEqual(expect.objectContaining({
                c: PermCRUD.CREATE
            }));
        });

        it("5. should extract paths for update operation", async () => {
            const query: VQL_Query_CRUD = {
                db: "test_db",
                d: {
                    update: {
                        collection: "users",
                        search: { name: "john" },
                        updater: { $set: { name: "jane" } }
                    }
                }
            };

            const result = await extractPaths(config, query);

            expect(result.db).toBeDefined();
            expect(result.c).toBe("users");
            expect(result.paths).toContainEqual(expect.objectContaining({
                p: PermCRUD.READ
            }));
            expect(result.paths).toContainEqual(expect.objectContaining({
                p: PermCRUD.UPDATE
            }));
        });

        it("6. should extract paths for remove operation", async () => {
            const query: VQL_Query_CRUD = {
                db: "test_db",
                d: {
                    remove: {
                        collection: "users",
                        search: { name: "john" }
                    }
                }
            };

            const result = await extractPaths(config, query);

            expect(result.db).toBeDefined();
            expect(result.c).toBe("users");
            expect(result.paths).toContainEqual(expect.objectContaining({
                c: PermCRUD.DELETE
            }));
        });

        it("7. should extract paths for updateOneOrAdd operation", async () => {
            const query: VQL_Query_CRUD = {
                db: "test_db",
                d: {
                    updateOneOrAdd: {
                        collection: "users",
                        search: { name: "john" },
                        updater: { $set: { name: "jane" } },
                        add_arg: { name: "new_user" }
                    }
                }
            };

            const result = await extractPaths(config, query);

            expect(result.db).toBeDefined();
            expect(result.c).toBe("users");
            expect(result.paths).toContainEqual(expect.objectContaining({
                c: PermCRUD.CREATE
            }));
            expect(result.paths).toContainEqual(expect.objectContaining({
                p: PermCRUD.READ
            }));
            expect(result.paths).toContainEqual(expect.objectContaining({
                p: PermCRUD.UPDATE
            }));
        });

        it("8. should extract paths for collection operations", async () => {
            const query: VQL_Query_CRUD = {
                db: "test_db",
                d: {
                    ensureCollection: {
                        collection: "users"
                    }
                }
            };

            const result = await extractPaths(config, query);

            expect(result.db).toBeDefined();
            expect(result.c).toBe("users");
            expect(result.paths).toContainEqual(expect.objectContaining({
                c: PermCRUD.COLLECTION
            }));
        });
    });

    describe("checkRequestPermission", () => {
        it("1. should return false for undefined query", async () => {
            const result = await checkRequestPermission(
                config,
                async () => ({ granted: true, via: "resolver", reason: "resolver" }),
                user,
                undefined as any
            );

            expect(result).toBe(false);
        });

        it("2. should return false when no user and permissionDeniedIfNoUser is true", async () => {
            const configWithPermissionCheck = new VQLConfig({ permissionDeniedIfNoUser: true });
            const result = await checkRequestPermission(
                configWithPermissionCheck,
                async () => ({ granted: true, via: "resolver", reason: "resolver" }),
                null,
                {
                    db: "test_db",
                    d: { find: { collection: "users" } }
                }
            );

            expect(result).toBe(false);
        });

        it("3. should return true when all permissions are granted for find operation", async () => {
            const permValidFn: PermValidFn = async (args) => {
                // For find operations, we check READ permissions for search fields
                if (args.p === PermCRUD.READ) {
                    return { granted: true, via: "resolver", reason: "resolver" };
                }
                return { granted: false, via: "resolver", reason: "resolver" };
            };

            const query: VQL_Query_CRUD = {
                db: "test_db",
                d: {
                    find: {
                        collection: "users",
                        search: { name: "john" }
                    }
                }
            };

            const result = await checkRequestPermission(
                config,
                permValidFn,
                user,
                query
            );

            expect(result).toBe(true);
        });

        it("4. should return false when permission is denied for find operation", async () => {
            const permValidFn: PermValidFn = async (args) => {
                // Deny READ permission for search fields
                if (args.p === PermCRUD.READ) {
                    return { granted: false, via: "resolver", reason: "ACL" };
                }
                return { granted: true, via: "resolver", reason: "resolver" };
            };

            const query: VQL_Query_CRUD = {
                db: "test_db",
                d: {
                    find: {
                        collection: "users",
                        search: { name: "john" }
                    }
                }
            };

            const result = await checkRequestPermission(
                config,
                permValidFn,
                user,
                query
            );

            expect(result).toBe(false);
        });

        it("5. should return true when collection CREATE permission is granted for add operation", async () => {
            const permValidFn: PermValidFn = async (args) => {
                // For add operations, we check CREATE collection permission
                if (args.p === PermCRUD.CREATE) {
                    return { granted: true, via: "resolver", reason: "resolver" };
                }
                return { granted: false, via: "resolver", reason: "resolver" };
            };

            const query: VQL_Query_CRUD = {
                db: "test_db",
                d: {
                    add: {
                        collection: "users",
                        data: { name: "john" }
                    }
                }
            };

            const result = await checkRequestPermission(
                config,
                permValidFn,
                user,
                query
            );

            expect(result).toBe(true);
        });

        it("6. should return false when collection CREATE permission is denied for add operation", async () => {
            const permValidFn: PermValidFn = async (args) => {
                // Deny CREATE permission
                if (args.p === PermCRUD.CREATE) {
                    return { granted: false, via: "resolver", reason: "ACL" };
                }
                return { granted: true, via: "resolver", reason: "resolver" };
            };

            const query: VQL_Query_CRUD = {
                db: "test_db",
                d: {
                    add: {
                        collection: "users",
                        data: { name: "john" }
                    }
                }
            };

            const result = await checkRequestPermission(
                config,
                permValidFn,
                user,
                query
            );

            expect(result).toBe(false);
        });

        it("7. should return true when all permissions are granted for update operation", async () => {
            const permValidFn: PermValidFn = async (args) => {
                // For update operations, we check READ permission for search fields and UPDATE for updater fields
                if (args.p === PermCRUD.READ || args.p === PermCRUD.UPDATE) {
                    return { granted: true, via: "resolver", reason: "resolver" };
                }
                return { granted: false, via: "resolver", reason: "resolver" };
            };

            const query: VQL_Query_CRUD = {
                db: "test_db",
                d: {
                    update: {
                        collection: "users",
                        search: { name: "john" },
                        updater: { $set: { name: "jane" } }
                    }
                }
            };

            const result = await checkRequestPermission(
                config,
                permValidFn,
                user,
                query
            );

            expect(result).toBe(true);
        });

        it("8. should return false when any permission is denied for update operation", async () => {
            const permValidFn: PermValidFn = async (args) => {
                // Deny UPDATE permission
                if (args.p === PermCRUD.UPDATE) {
                    return { granted: false, via: "resolver", reason: "ACL" };
                }
                // Grant READ permission
                if (args.p === PermCRUD.READ) {
                    return { granted: true, via: "resolver", reason: "resolver" };
                }
                return { granted: false, via: "resolver", reason: "resolver" };
            };

            const query: VQL_Query_CRUD = {
                db: "test_db",
                d: {
                    update: {
                        collection: "users",
                        search: { name: "john" },
                        updater: { $set: { name: "jane" } }
                    }
                }
            };

            const result = await checkRequestPermission(
                config,
                permValidFn,
                user,
                query
            );

            expect(result).toBe(false);
        });
    });

    describe("filterObjectByPermissions", () => {
        it("1. should return object unchanged when all fields have READ permission", async () => {
            const permValidFn: PermValidFn = async () => ({
                granted: true,
                via: "resolver",
                reason: "resolver",
            });

            const obj = { _id: "123", name: "John", email: "john@example.com" };
            const result = await filterObjectByPermissions(
                config,
                permValidFn,
                user,
                "test_db",
                "users",
                obj,
            );

            expect(result).toEqual(obj);
        });

        it("2. should exclude fields without READ permission", async () => {
            const permValidFn: PermValidFn = async (args) => {
                const field = args.path[args.path.length - 1];
                if (field === "password") {
                    return { granted: false, via: "resolver", reason: "ACL" };
                }
                return { granted: true, via: "resolver", reason: "resolver" };
            };

            const obj = { _id: "123", name: "John", password: "secret" };
            const result = await filterObjectByPermissions(
                config,
                permValidFn,
                user,
                "test_db",
                "users",
                obj,
            );

            expect(result).toEqual({ _id: "123", name: "John" });
            expect(result).not.toHaveProperty("password");
        });

        it("3. should handle null/undefined objects", async () => {
            const permValidFn: PermValidFn = async () => ({
                granted: true,
                via: "resolver",
                reason: "resolver",
            });

            expect(await filterObjectByPermissions(config, permValidFn, user, "db", "col", null as any)).toBe(null);
            expect(await filterObjectByPermissions(config, permValidFn, user, "db", "col", undefined as any)).toBe(undefined);
        });
    });

    describe("filterObjectsByPermissions", () => {
        it("4. should filter array of objects", async () => {
            const permValidFn: PermValidFn = async (args) => {
                const field = args.path[args.path.length - 1];
                if (field === "secret") {
                    return { granted: false, via: "resolver", reason: "ACL" };
                }
                return { granted: true, via: "resolver", reason: "resolver" };
            };

            const objects = [
                { _id: "1", name: "John", secret: "a" },
                { _id: "2", name: "Jane", secret: "b" },
            ];

            const result = await filterObjectsByPermissions(
                config,
                permValidFn,
                user,
                "test_db",
                "users",
                objects,
            );

            expect(result).toEqual([
                { _id: "1", name: "John" },
                { _id: "2", name: "Jane" },
            ]);
        });

        it("5. should handle non-array input", async () => {
            const permValidFn: PermValidFn = async () => ({
                granted: true,
                via: "resolver",
                reason: "resolver",
            });

            const result = await filterObjectsByPermissions(
                config,
                permValidFn,
                user,
                "db",
                "col",
                "not an array" as any,
            );

            expect(result).toBe("not an array");
        });

        it("6. should filter nested fields recursively", async () => {
            const permValidFn: PermValidFn = async (args) => {
                const pathStr = args.path.join("/");
                if (pathStr.includes("password")) {
                    return { granted: false, via: "resolver", reason: "ACL" };
                }
                return { granted: true, via: "resolver", reason: "resolver" };
            };

            const obj = {
                _id: "123",
                profile: {
                    name: "John",
                    password: "secret",
                    address: {
                        city: "NYC",
                        password: "nested-secret",
                    },
                },
            };

            const result = await filterObjectByPermissions(
                config,
                permValidFn,
                user,
                "test_db",
                "users",
                obj,
            );

            expect(result).toEqual({
                _id: "123",
                profile: {
                    name: "John",
                    address: {
                        city: "NYC",
                    },
                },
            });
        });

        it("7. should use strictACL fallback when entity-404", async () => {
            const configWithFallback = new VQLConfig({
                strictACL: false,
                noCheckPermissions: false,
                strictSelect: true,
            });

            const permValidFn: PermValidFn = async (args) => {
                const pathStr = args.path.join("/");
                // Grant at collection level
                if (pathStr === "test_db/users") {
                    return { granted: true, via: "resolver", reason: "resolver" };
                }
                // Deny at field level with entity-404
                if (args.path.length === 3) {
                    return { granted: false, via: "resolver", reason: "entity-404" };
                }
                return { granted: false, via: "resolver", reason: "ACL" };
            };

            const obj = { _id: "123", name: "John", email: "john@example.com" };

            const result = await filterObjectByPermissions(
                configWithFallback,
                permValidFn,
                user,
                "test_db",
                "users",
                obj,
            );

            // Should keep all fields because collection-level permission is granted
            expect(result).toEqual(obj);
        });

        it("8. should NOT use fallback when strictACL is true", async () => {
            const configStrict = new VQLConfig({
                strictACL: true,
                noCheckPermissions: false,
                strictSelect: true,
            });

            const permValidFn: PermValidFn = async (args) => {
                const pathStr = args.path.join("/");
                // Grant at collection level
                if (pathStr === "test_db/users") {
                    return { granted: true, via: "resolver", reason: "resolver" };
                }
                // Deny at field level with entity-404
                if (args.path.length === 3) {
                    return { granted: false, via: "resolver", reason: "entity-404" };
                }
                return { granted: false, via: "resolver", reason: "ACL" };
            };

            const obj = { _id: "123", name: "John", email: "john@example.com" };

            const result = await filterObjectByPermissions(
                configStrict,
                permValidFn,
                user,
                "test_db",
                "users",
                obj,
            );

            // Should remove all fields because strictACL prevents fallback
            expect(result).toEqual({});
        });
    });
});
