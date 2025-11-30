import { PermissionResolverEngine } from "#permissions/resolver";
import { PermCRUD } from "#types/perm";
import { describe, expect, it } from "bun:test";
import { GateWarden } from "@wxn0brp/gate-warden";

describe("PermissionResolverEngine", () => {
    describe("addResolver", () => {
        it("should add a resolver with string matcher", async () => {
            const engine = new PermissionResolverEngine();
            const resolver = async () => true;
            engine.addResolver("db/users", resolver);

            const permValidFn = engine.create();

            const result = await permValidFn({
                field: "some-field",
                path: ["db", "users"],
                p: PermCRUD.READ,
                user: { id: "user1" }
            });

            expect(result).toEqual({ granted: true, via: "resolver" });
        });
    });

    describe("create", () => {
        it("should return a function that checks string matchers", async () => {
            const engine = new PermissionResolverEngine();
            engine.addResolver("db/users", async () => true);

            const permValidFn = engine.create();

            const result = await permValidFn({
                field: "some-field",
                path: ["db", "users"],
                p: PermCRUD.READ,
                user: { id: "user1" }
            });

            expect(result).toEqual({ granted: true, via: "resolver" });
        });

        it("should return a function that does not match when string matcher doesn't match", async () => {
            const engine = new PermissionResolverEngine();
            engine.addResolver("db/users", async () => true);

            const permValidFn = engine.create();

            const result = await permValidFn({
                field: "some-field",
                path: ["db", "posts"],
                p: PermCRUD.READ,
                user: { id: "user1" }
            });

            expect(result).toEqual({ granted: false, via: "no-resolver-match" });
        });

        it("should return a function that checks regex matchers", async () => {
            const engine = new PermissionResolverEngine();
            engine.addResolver(/^db\/users\//, async () => true);

            const permValidFn = engine.create();

            const result = await permValidFn({
                field: "some-field",
                path: ["db", "users", "name"],
                p: PermCRUD.READ,
                user: { id: "user1" }
            });

            expect(result).toEqual({ granted: true, via: "resolver" });
        });

        it("should return a function that checks function matchers", async () => {
            const engine = new PermissionResolverEngine();
            const customMatcher = async (originalPath: string, path: string[]) => {
                return path.length >= 2 && path[0] === "db" && path[1] === "users";
            };

            engine.addResolver(customMatcher, async () => true);

            const permValidFn = engine.create();

            const result = await permValidFn({
                field: "some-field",
                path: ["db", "users"],
                p: PermCRUD.READ,
                user: { id: "user1" }
            });

            expect(result).toEqual({ granted: true, via: "resolver" });
        });

        it("should return correct value when resolver throws an error", async () => {
            const engine = new PermissionResolverEngine();
            engine.addResolver("db/users", async () => {
                throw new Error("Resolver error");
            });

            const permValidFn = engine.create();

            const result = await permValidFn({
                field: "some-field",
                path: ["db", "users"],
                p: PermCRUD.READ,
                user: { id: "user1" }
            });

            expect(result).toEqual({ granted: false, via: "resolver-error" });
        });

        it("should check multiple resolvers and return on first match", async () => {
            const engine = new PermissionResolverEngine();
            engine.addResolver("db/posts", async () => false);
            engine.addResolver("db/users", async () => true);
            engine.addResolver("db/comments", async () => true);

            const permValidFn = engine.create();

            const result = await permValidFn({
                field: "some-field",
                path: ["db", "users"],
                p: PermCRUD.READ,
                user: { id: "user1" }
            });

            expect(result).toEqual({ granted: true, via: "resolver" });
        });

        it("should return false when no resolvers match", async () => {
            const engine = new PermissionResolverEngine();
            engine.addResolver("db/posts", async () => true);

            const permValidFn = engine.create();

            const result = await permValidFn({
                field: "some-field",
                path: ["db", "users"],
                p: PermCRUD.READ,
                user: { id: "user1" }
            });

            expect(result).toEqual({ granted: false, via: "no-resolver-match" });
        });
    });

    describe("createWithGw", () => {
        it("should use resolver if it grants permission", async () => {
            const engine = new PermissionResolverEngine();
            const mockGw = {
                hasAccess: async () => ({ granted: false })
            } as any as GateWarden;

            engine.addResolver("db/users", async () => true);

            const permValidFn = engine.createWithGw(mockGw);

            const result = await permValidFn({
                field: "some-field",
                path: ["db", "users"],
                p: PermCRUD.READ,
                user: { id: "user1" }
            });

            expect(result).toEqual({ granted: true, via: "resolver" });
        });

        it("should return resolver result if resolver denies permission but matches", async () => {
            const engine = new PermissionResolverEngine();
            const mockGw = {
                hasAccess: async () => ({ granted: true, via: "gw-result" })
            } as any as GateWarden;

            engine.addResolver("db/users", async () => false);

            const permValidFn = engine.createWithGw(mockGw);

            const result = await permValidFn({
                field: "some-field",
                path: ["db", "users"],
                p: PermCRUD.READ,
                user: { id: "user1" }
            });

            expect(result).toEqual({ granted: false, via: "resolver" });
        });

        it("should use GateWarden if no resolver matches and GateWarden grants", async () => {
            const engine = new PermissionResolverEngine();
            const mockGw = {
                hasAccess: async () => ({ granted: true, via: "gw-result" })
            } as any as GateWarden;

            // No resolvers added that match this path
            engine.addResolver("db/posts", async () => true);

            const permValidFn = engine.createWithGw(mockGw);

            const result = await permValidFn({
                field: "some-field",
                path: ["db", "users"],
                p: PermCRUD.READ,
                user: { id: "user1" }
            });

            expect(result).toEqual({ granted: true, via: "gate-warden" });
        });

        it("should use GateWarden if no resolver matches and GateWarden denies", async () => {
            const engine = new PermissionResolverEngine();
            const mockGw = {
                hasAccess: async () => ({ granted: false, via: "gw-result" })
            } as any as GateWarden;

            // No resolvers added that match this path
            engine.addResolver("db/posts", async () => true);

            const permValidFn = engine.createWithGw(mockGw);

            const result = await permValidFn({
                field: "some-field",
                path: ["db", "users"],
                p: PermCRUD.READ,
                user: { id: "user1" }
            });

            expect(result).toEqual({ granted: false, via: "gate-warden" });
        });

        it("should return false if resolver denies permission but matches", async () => {
            const engine = new PermissionResolverEngine();
            const mockGw = {
                hasAccess: async () => ({ granted: true })
            } as any as GateWarden;

            engine.addResolver("db/users", async () => false);

            const permValidFn = engine.createWithGw(mockGw);

            const result = await permValidFn({
                field: "some-field",
                path: ["db", "users"],
                p: PermCRUD.READ,
                user: { id: "user1" }
            });

            expect(result).toEqual({ granted: false, via: "resolver" });
        });
    });
});