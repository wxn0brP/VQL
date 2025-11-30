import { VQLConfig } from "#helpers/config";
import { checkRelationPermission } from "#permissions/relation";
import { PermCRUD, PermValidFn } from "#types/perm";
import { VQL_Query_Relation } from "#types/vql";
import { describe, expect, it } from "bun:test";

describe("checkRelationPermission", () => {
    const config = new VQLConfig();
    const user = {
        _id: "test1"
    };

    describe("when all permissions are granted", () => {
        it("should return true for valid relation query", async () => {
            const permValidFn: PermValidFn = async () => ({ granted: true, via: "test-fn" });

            const query: VQL_Query_Relation = {
                r: {
                    path: ["db", "posts"],
                    relations: {
                        comments: {
                            path: ["db", "comments"]
                        }
                    },
                    search: {
                        _id: "post123"
                    }
                }
            };

            const res = await checkRelationPermission(
                config,
                permValidFn,
                user,
                query
            );

            expect(res).toBe(true);
        });
    });

    describe("when permissions are denied", () => {
        it("should return false when permission is denied for main relation path", async () => {
            const permValidFn: PermValidFn = async (args) => {
                if (args.path.join("/") === "db/posts") {
                    return { granted: false, via: "acl" };
                }
                return { granted: true, via: "test-fn" };
            };

            const query: VQL_Query_Relation = {
                r: {
                    path: ["db", "posts"],
                    relations: {
                        comments: {
                            path: ["db", "comments"]
                        }
                    },
                    search: {
                        _id: "post123"
                    }
                }
            };

            const res = await checkRelationPermission(
                config,
                permValidFn,
                user,
                query
            );

            expect(res).toBe(false);
        });

        it("should return false when permission is denied for nested relation", async () => {
            const permValidFn: PermValidFn = async (args) => {
                if (args.path.join("/") === "db/comments") {
                    return { granted: false, via: "acl" };
                }
                return { granted: true, via: "test-fn" };
            };

            const query: VQL_Query_Relation = {
                r: {
                    path: ["db", "posts"],
                    relations: {
                        comments: {
                            path: ["db", "comments"]
                        }
                    },
                    search: {
                        _id: "post123"
                    }
                }
            };

            const res = await checkRelationPermission(
                config,
                permValidFn,
                user,
                query
            );

            expect(res).toBe(false);
        });
    });

    describe("when permissions are granted for specific CRUD operations", () => {
        it("should check for READ permission on relation fields", async () => {
            let permissionCheckArgs: any[] = [];

            const permValidFn: PermValidFn = async (args) => {
                permissionCheckArgs.push(args);
                return { granted: true, via: "test-fn" };
            };

            const query: VQL_Query_Relation = {
                r: {
                    path: ["db", "posts"],
                    relations: {
                        comments: {
                            path: ["db", "comments"]
                        }
                    },
                    search: {
                        _id: "post123"
                    }
                }
            };

            await checkRelationPermission(
                config,
                permValidFn,
                user,
                query
            );

            // Check that READ permission was requested for the main path
            const mainPathCheck = permissionCheckArgs.some(args =>
                args.path.join("/") === "db/posts" && args.p === PermCRUD.READ
            );
            expect(mainPathCheck).toBe(true);
        });
    });
});