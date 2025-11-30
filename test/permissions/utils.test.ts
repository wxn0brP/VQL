import { VQLConfig } from "#helpers/config";
import { extractPathsFromData, getHash, hashKey } from "#permissions/utils";
import { describe, expect, it } from "bun:test";

describe("Permissions/Utils", () => {
    describe("getHash", () => {
        it("should generate a valid SHA-256 hash", async () => {
            const input = "test";
            const hash = await getHash(input);

            // SHA-256 produces a 64 character hex string
            expect(hash).toHaveLength(64);
            expect(hash).toMatch(/^[a-f0-9]+$/);
        });

        it("should generate consistent hash for the same input", async () => {
            const input = "consistent-test";
            const hash1 = await getHash(input);
            const hash2 = await getHash(input);

            expect(hash1).toBe(hash2);
        });

        it("should generate different hashes for different inputs", async () => {
            const hash1 = await getHash("input1");
            const hash2 = await getHash("input2");

            expect(hash1).not.toBe(hash2);
        });

        it("should handle empty string", async () => {
            const hash = await getHash("");
            expect(hash).toHaveLength(64);
            expect(hash).toMatch(/^[a-f0-9]+$/);
        });
    });

    describe("hashKey", () => {
        it("should hash the path when hidePath is true", async () => {
            const config = new VQLConfig({ hidePath: true });
            const path = ["db", "users", "profile"];
            const result = await hashKey(config, path);

            // Should return a hash (64 character hex string)
            expect(result).toHaveLength(64);
            expect(result).toMatch(/^[a-f0-9]+$/);
        });

        it("should return JSON string when hidePath is false", async () => {
            const config = new VQLConfig({ hidePath: false });
            const path = ["db", "users", "profile"];
            const result = await hashKey(config, path);

            // Should return the JSON string representation
            expect(result).toBe(JSON.stringify(path));
        });

        it("should handle complex nested paths", async () => {
            const config = new VQLConfig({ hidePath: true });
            const path = ["db", "users", { id: "123", field: "name" }];
            const result = await hashKey(config, path);

            // Should return a hash (64 character hex string)
            expect(result).toHaveLength(64);
            expect(result).toMatch(/^[a-f0-9]+$/);
        });
    });

    describe("extractPathsFromData", () => {
        it("should extract simple path from flat object", () => {
            const data = { name: "John", age: 30 };
            const paths = extractPathsFromData(data);

            expect(paths).toEqual([
                { path: [], key: "name" },
                { path: [], key: "age" }
            ]);
        });

        it("should extract nested paths from object", () => {
            const data = {
                user: {
                    profile: {
                        name: "John"
                    },
                    settings: {
                        theme: "dark"
                    }
                }
            };
            const paths = extractPathsFromData(data);

            expect(paths).toEqual([
                { path: ["user", "profile"], key: "name" },
                { path: ["user", "settings"], key: "theme" }
            ]);
        });

        it("should handle mixed nested and flat properties", () => {
            const data = {
                name: "John",
                profile: {
                    age: 30,
                    location: "NYC"
                },
                active: true
            };
            const paths = extractPathsFromData(data);

            expect(paths).toEqual([
                { path: [], key: "name" },
                { path: ["profile"], key: "age" },
                { path: ["profile"], key: "location" },
                { path: [], key: "active" }
            ]);
        });

        it("should handle arrays properly", () => {
            const data = {
                posts: [
                    { title: "Post 1", content: "Content 1" },
                    { title: "Post 2", content: "Content 2" }
                ]
            };
            const paths = extractPathsFromData(data);

            expect(paths).toEqual([
                { path: ["posts", "0"], key: "title" },
                { path: ["posts", "0"], key: "content" },
                { path: ["posts", "1"], key: "title" },
                { path: ["posts", "1"], key: "content" }
            ]);
        });

        it("should handle empty object", () => {
            const data = {};
            const paths = extractPathsFromData(data);

            expect(paths).toEqual([]);
        });

        it("should handle null and undefined values", () => {
            const data = {
                nullValue: null,
                stringValue: "test"
            };
            const paths = extractPathsFromData(data);

            expect(paths).toEqual([
                { path: [], key: "stringValue" }
            ]);
        });

        it("should handle various data types", () => {
            const data = {
                string: "test",
                number: 42,
                boolean: true,
                nullValue: null,
                array: [1, 2, 3],
                object: { nested: "value" }
            };
            const paths = extractPathsFromData(data);

            expect(paths).toEqual([
                { path: [], key: "string" },
                { path: [], key: "number" },
                { path: [], key: "boolean" },
                { path: ["array"], key: "0" },
                { path: ["array"], key: "1" },
                { path: ["array"], key: "2" },
                { path: ["object"], key: "nested" }
            ]);
        });
    });
});