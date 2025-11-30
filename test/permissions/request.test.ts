import { VQLConfig } from "#helpers/config";
import { checkRequestPermission, extractPaths, processFieldPath } from "#permissions/request";
import { PermCRUD, PermValidFn } from "#types/perm";
import { VQL_Query_CRUD } from "#types/vql";
import { describe, expect, it } from "bun:test";

describe("Permissions/Request", () => {
    const config = new VQLConfig();
    const user = { _id: "test_user" };

    describe("processFieldPath", () => {
        it("should process simple field path correctly", () => {
            const pathObj = { path: ["users"], key: "name" };
            const result = processFieldPath(pathObj);
            expect(result).toEqual(["users", "name"]);
        });

        it("should handle subset mode correctly", () => {
            const pathObj = { path: ["users", "$subset", "profile"], key: "email" };
            const result = processFieldPath(pathObj);
            expect(result).toEqual(["users", "profile", "email"]);
        });

        it("should skip keys that start with $", () => {
            const pathObj = { path: ["users"], key: "$or" };
            const result = processFieldPath(pathObj);
            expect(result).toEqual(["users"]);
        });

        it("should handle nested paths without subset", () => {
            const pathObj = { path: ["posts", "author"], key: "name" };
            const result = processFieldPath(pathObj);
            expect(result).toEqual(["posts", "author", "name"]);
        });
    });

    describe("extractPaths", () => {
        it("should extract paths for find operation", async () => {
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

        it("should extract paths for findOne operation", async () => {
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

        it("should extract paths for find alias (f) operation", async () => {
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

        it("should extract collection permission for add operation", async () => {
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

        it("should extract paths for update operation", async () => {
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

        it("should extract paths for remove operation", async () => {
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

        it("should extract paths for updateOneOrAdd operation", async () => {
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

        it("should extract paths for collection operations", async () => {
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
        it("should return false for undefined query", async () => {
            const result = await checkRequestPermission(
                config,
                async () => ({ granted: true, via: "test" }),
                user,
                undefined as any
            );

            expect(result).toBe(false);
        });

        it("should return false when no user and permissionDeniedIfNoUser is true", async () => {
            const configWithPermissionCheck = new VQLConfig({ permissionDeniedIfNoUser: true });
            const result = await checkRequestPermission(
                configWithPermissionCheck,
                async () => ({ granted: true, via: "test" }),
                null,
                {
                    db: "test_db",
                    d: { find: { collection: "users" } }
                }
            );

            expect(result).toBe(false);
        });

        it("should return true when all permissions are granted for find operation", async () => {
            const permValidFn: PermValidFn = async (args) => {
                // For find operations, we check READ permissions for search fields
                if (args.p === PermCRUD.READ) {
                    return { granted: true, via: "test" };
                }
                return { granted: false, via: "test" };
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

        it("should return false when permission is denied for find operation", async () => {
            const permValidFn: PermValidFn = async (args) => {
                // Deny READ permission for search fields
                if (args.p === PermCRUD.READ) {
                    return { granted: false, via: "acl" };
                }
                return { granted: true, via: "test" };
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

        it("should return true when collection CREATE permission is granted for add operation", async () => {
            const permValidFn: PermValidFn = async (args) => {
                // For add operations, we check CREATE collection permission
                if (args.p === PermCRUD.CREATE) {
                    return { granted: true, via: "test" };
                }
                return { granted: false, via: "test" };
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

        it("should return false when collection CREATE permission is denied for add operation", async () => {
            const permValidFn: PermValidFn = async (args) => {
                // Deny CREATE permission
                if (args.p === PermCRUD.CREATE) {
                    return { granted: false, via: "acl" };
                }
                return { granted: true, via: "test" };
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

        it("should return true when all permissions are granted for update operation", async () => {
            const permValidFn: PermValidFn = async (args) => {
                // For update operations, we check READ permission for search fields and UPDATE for updater fields
                if (args.p === PermCRUD.READ || args.p === PermCRUD.UPDATE) {
                    return { granted: true, via: "test" };
                }
                return { granted: false, via: "test" };
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

        it("should return false when any permission is denied for update operation", async () => {
            const permValidFn: PermValidFn = async (args) => {
                // Deny UPDATE permission
                if (args.p === PermCRUD.UPDATE) {
                    return { granted: false, via: "acl" };
                }
                // Grant READ permission
                if (args.p === PermCRUD.READ) {
                    return { granted: true, via: "test" };
                }
                return { granted: false, via: "test" };
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
});