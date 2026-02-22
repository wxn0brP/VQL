import { VQLProcessor } from "../../src/processor";
import { createMemoryValthera } from "@wxn0brp/db-core";
import { describe, expect, it } from "bun:test";

function createTestVQLProcessor() {
    const db = createMemoryValthera({
        users: [
            { _id: 1, name: "Mara", age: 30, status: "active" },
            { _id: 2, name: "Kitty", age: 25, status: "active" },
            { _id: 3, name: "Harry", age: 40, status: "inactive" },
            { _id: 4, name: "Alice", age: 35, status: "active" }
        ],
        posts: [
            { _id: 1, title: "Post 1", author: "Mara", status: "published" },
            { _id: 2, title: "Post 2", author: "Kitty", status: "draft" },
            { _id: 3, title: "Post 3", author: "Harry", status: "published" }
        ],
        orders: [
            { _id: 100, customerId: 1, status: "pending", total: 50 },
            { _id: 200, customerId: 2, status: "shipped", total: 100 },
            { _id: 300, customerId: 1, status: "delivered", total: 75 }
        ],
        customers: [
            { _id: 1, name: "John", email: "john@example.com" },
            { _id: 2, name: "Jane", email: "jane@example.com" }
        ]
    });
    return new VQLProcessor({ db });
}

describe("runtime", () => {
    describe("VQLS - Find Operations", () => {
        const VQL = createTestVQLProcessor();

        it("1. find all users (find operation)", async () => {
            const result = await VQL.execute(`db find users`);
            expect(result).toHaveLength(4);
        });

        it("2. findOne with ! suffix", async () => {
            const result = await VQL.execute(`db users!`);
            expect(result).toEqual({ _id: 1, name: "Mara", age: 30, status: "active" });
        });

        it("3. findOne with search condition", async () => {
            const result = await VQL.execute(`db users! s._id=3`);
            expect(result).toEqual({ _id: 3, name: "Harry", age: 40, status: "inactive" });
        });

        it("4. find with search condition - active users", async () => {
            const result = await VQL.execute(`db find users s.status="active"`);
            expect(result).toHaveLength(3);
            expect(result.every(u => u.status === "active")).toBe(true);
        });

        it("5. find with search condition and limit option", async () => {
            const result = await VQL.execute(`db find users s.status="active" o.limit=2`);
            expect(result).toHaveLength(2);
        });

        it("6. find with multiple search conditions", async () => {
            const result = await VQL.execute(`db find users s.status="active" s.age=30`);
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe("Mara");
        });
    });

    describe("VQLS - Add Operations (+)", () => {
        const VQL = createTestVQLProcessor();

        it("1. add single customer with d. prefix", async () => {
            const result = await VQL.execute(`db +customers d.name="Bob" d.email="bob@example.com"`);
            expect(result).toMatchObject({ name: "Bob", email: "bob@example.com" });
        });

        it("2. add user with multiple data fields", async () => {
            const result = await VQL.execute(`db +users d.name="Charlie" d.age=28 d.status="active"`);
            expect(result).toMatchObject({ name: "Charlie", age: 28, status: "active" });
        });

        it("3. add post with data payload", async () => {
            const result = await VQL.execute(`db +posts d.title="New Post" d.author="Alice" d.status="draft"`);
            expect(result).toMatchObject({ title: "New Post", author: "Alice", status: "draft" });
        });
    });

    describe("VQLS - Update Operations (~)", () => {
        const VQL = createTestVQLProcessor();

        it("1. updateOne with ~! and search condition", async () => {
            const result = await VQL.execute(`db ~users! s._id=1 u.status="inactive"`);
            expect(result).toMatchObject({ _id: 1, status: "inactive" });
        });

        it("2. update with ~ and search condition", async () => {
            const result = await VQL.execute(`db ~posts s.status="draft" u.status="archived"`);
            expect(Array.isArray(result)).toBe(true);
            expect(result.every(p => p.status === "archived")).toBe(true);
        });

        it("3. updateOne with multiple update fields", async () => {
            const result = await VQL.execute(`db ~users! s._id=2 u.name="Katherine" u.age=26`);
            expect(result).toMatchObject({ _id: 2, name: "Katherine", age: 26 });
        });

        it("4. update using u. prefix for updater", async () => {
            const result = await VQL.execute(`db ~orders! s._id=100 u.status="cancelled"`);
            expect(result).toMatchObject({ _id: 100, status: "cancelled" });
        });
    });

    describe("VQLS - Remove Operations (-)", () => {
        const VQL = createTestVQLProcessor();

        it("1. removeOne with -! suffix", async () => {
            const result = await VQL.execute(`db -users! s._id=4`);
            expect(result).toMatchObject({ _id: 4, name: "Alice" });
        });

        it("2. remove with search condition", async () => {
            const result = await VQL.execute(`db -posts s.status="draft"`);
            expect(Array.isArray(result)).toBe(true);
        });

        it("3. remove inactive users", async () => {
            const result = await VQL.execute(`db -users s.status="inactive"`);
            expect(Array.isArray(result)).toBe(true);
        });

        it("4. removeOne with boolean condition", async () => {
            const result = await VQL.execute(`db -orders! s._id=200`);
            expect(result).toMatchObject({ _id: 200 });
        });
    });

    describe("VQLS - Options (o. prefix)", () => {
        const VQL = createTestVQLProcessor();

        it("1. find with limit option", async () => {
            const result = await VQL.execute(`db find users o.limit=2`);
            expect(result).toHaveLength(2);
        });

        it("2. find with skip/offset option", async () => {
            const result = await VQL.execute(`db find users o.skip=2 o.limit=2`);
            expect(result).toHaveLength(2);
        });

        it("3. find with multiple options", async () => {
            const result = await VQL.execute(`db find users o.limit=2 o.skip=1`);
            expect(result).toHaveLength(2);
        });
    });

    describe("VQLS - Combined Operations", () => {
        const VQL = createTestVQLProcessor();

        it("1. find active users with limit", async () => {
            const result = await VQL.execute(`db find users s.status="active" o.limit=2`);
            expect(result).toHaveLength(2);
            expect(result.every(u => u.status === "active")).toBe(true);
        });

        it("2. update active posts and limit results", async () => {
            const result = await VQL.execute(`db ~posts s.status="published" u.status="featured" o.limit=1`);
            expect(Array.isArray(result)).toBe(true);
        });

        it("3. add and verify data fields", async () => {
            const result = await VQL.execute(`db +customers d.name="Test User" d.email="test@test.com"`);
            expect(result.name).toBe("Test User");
            expect(result.email).toBe("test@test.com");
        });
    });

    describe("VQLS - Edge Cases", () => {
        const VQL = createTestVQLProcessor();

        it("1. findOne with no results returns null", async () => {
            const result = await VQL.execute(`db users! s._id=999`);
            expect(result).toBeNull();
        });

        it("2. find with no results returns empty array", async () => {
            const result = await VQL.execute(`db find users s.name="NonExistent"`);
            expect(result).toEqual([]);
        });

        it("3. updateOne with no matching results", async () => {
            const result = await VQL.execute(`db ~users! s._id=999 u.name="Nobody"`);
            expect(result).toBeNull();
        });

        it("4. removeOne with no matching results", async () => {
            const result = await VQL.execute(`db -users! s._id=999`);
            expect(result).toBeNull();
        });
    });

    describe("VQLS - Examples from Documentation", () => {
        const VQL = createTestVQLProcessor();

        it("1. Find active users (doc example)", async () => {
            const result = await VQL.execute(`db find users s.status="active" o.limit=5`);
            expect(result.length).toBeGreaterThan(0);
            expect(result.every(u => u.status === "active")).toBe(true);
        });

        it("2. Create user (doc example)", async () => {
            const result = await VQL.execute(`db +customers d.name="Alice" d.email="a@x.com"`);
            expect(result.name).toBe("Alice");
            expect(result.email).toBe("a@x.com");
        });

        it("3. Update order status (doc example)", async () => {
            const result = await VQL.execute(`db ~orders! s._id=100 u.status="shipped"`);
            expect(result).toMatchObject({ _id: 100, status: "shipped" });
        });

        it("4. Delete inactive users (doc example)", async () => {
            const result = await VQL.execute(`db -users s.status="inactive"`);
            expect(Array.isArray(result)).toBe(true);
        });
    });
});
