import { convertSearchObjToSearchArray, extractMeta } from "#cpu/string/utils";
import { describe, expect, it } from "bun:test";

describe("CPU/String/Utils", () => {
    describe("extractMeta", () => {
        it("should extract metadata for simple find query", () => {
            const result = extractMeta("mydb users");
            expect(result).toEqual({
                db: "mydb",
                op: "find",
                collection: "users",
                body: ""
            });
        });

        it("should extract metadata for query with explicit operation", () => {
            const result = extractMeta("mydb find users");
            expect(result).toEqual({
                db: "mydb",
                op: "find",
                collection: "users",
                body: ""
            });
        });

        it("should extract metadata for query with operation and body", () => {
            const result = extractMeta("mydb update users s.name = 'John' u.name = 'Jane'");
            expect(result).toEqual({
                db: "mydb",
                op: "update",
                collection: "users",
                body: "s.name = 'John' u.name = 'Jane'"
            });
        });

        it("should extract metadata for 'getCollections' operation", () => {
            const result = extractMeta("mydb getCollections");
            expect(result).toEqual({
                db: "mydb",
                op: "getCollections",
                collection: "",
                body: ""
            });
        });

        it("should handle operation with special character prefix", () => {
            const result = extractMeta("mydb +users"); // '+' means 'add'
            expect(result).toEqual({
                db: "mydb",
                op: "add",
                collection: "users",
                body: ""
            });
        });

        it("should handle operation with special character prefix and '!' suffix", () => {
            const result = extractMeta("mydb +users!"); // '+' means 'add', '!' means 'One'
            expect(result).toEqual({
                db: "mydb",
                op: "add", // add doesn't get changed to addOne
                collection: "users",
                body: ""
            });
        });

        it("should handle update operation with '!' suffix", () => {
            const result = extractMeta("mydb ~posts!"); // '~' means 'update', '!' means 'One'
            expect(result).toEqual({
                db: "mydb",
                op: "updateOne", // update becomes updateOne
                collection: "posts",
                body: ""
            });
        });

        it("should handle different special character prefixes", () => {
            expect(extractMeta("mydb -users")).toEqual({
                db: "mydb",
                op: "remove",
                collection: "users",
                body: ""
            });

            expect(extractMeta("mydb ~posts")).toEqual({
                db: "mydb",
                op: "update",
                collection: "posts",
                body: ""
            });

            expect(extractMeta("mydb ?comments")).toEqual({
                db: "mydb",
                op: "updateOneOrAdd",
                collection: "comments",
                body: ""
            });

            expect(extractMeta("mydb ^likes")).toEqual({
                db: "mydb",
                op: "toggleOne",
                collection: "likes",
                body: ""
            });
        });

        it("should handle queries with comments", () => {
            const input = `
                # This is a comment
                mydb find users
                // This is also a comment
            `;
            const result = extractMeta(input);
            expect(result).toEqual({
                db: "mydb",
                op: "find",
                collection: "users",
                body: ""
            });
        });

        it("should handle multi-line queries", () => {
            const input = `mydb
                           find
                           users
                           s.name = 'John'`;
            const result = extractMeta(input);
            expect(result).toEqual({
                db: "mydb",
                op: "find",
                collection: "users",
                body: "s.name = 'John'"
            });
        });

        it("should throw error for invalid query with less than 2 parts", () => {
            expect(() => extractMeta("mydb")).toThrow("Invalid query");
        });

        it("should handle complex query body with special characters", () => {
            const result = extractMeta("mydb find users s._id == 123 and s.status in ['active', 'pending']");
            expect(result).toEqual({
                db: "mydb",
                op: "find",
                collection: "users",
                body: "s._id == 123 and s.status in ['active', 'pending']"
            });
        });
    });

    describe("convertSearchObjToSearchArray", () => {
        it("should convert simple flat object to search array", () => {
            const obj = { name: "John", age: 30 };
            const result = convertSearchObjToSearchArray(obj);
            expect(result).toEqual([
                ["name"],
                ["age"]
            ]);
        });

        it("should convert nested object to search array", () => {
            const obj = {
                user: {
                    profile: {
                        name: "John",
                        settings: {
                            theme: "dark"
                        }
                    }
                }
            };
            const result = convertSearchObjToSearchArray(obj);
            expect(result).toEqual([
                ["user", "profile", "name"],
                ["user", "profile", "settings", "theme"]
            ]);
        });

        it("should handle mixed nested and flat properties", () => {
            const obj = {
                name: "John",
                profile: {
                    age: 30,
                    location: "NYC"
                },
                active: true
            };
            const result = convertSearchObjToSearchArray(obj);
            expect(result).toEqual([
                ["name"],
                ["profile", "age"],
                ["profile", "location"],
                ["active"]
            ]);
        });

        it("should handle object with null and undefined values", () => {
            const obj = {
                name: "John",
                nullValue: null,
                undefinedValue: undefined,
                active: true
            };
            const result = convertSearchObjToSearchArray(obj);
            // Should skip null and undefined values
            expect(result).toEqual([
                ["name"],
                ["active"]
            ]);
        });

        it("should handle object with falsy values", () => {
            const obj = {
                name: "John",
                emptyString: "",
                zero: 0,
                falseValue: false,
                nullValue: null,
                undefinedValue: undefined,
                active: true
            };
            const result = convertSearchObjToSearchArray(obj);
            // Should skip all falsy values (empty string, 0, false, null, undefined)
            expect(result).toEqual([
                ["name"],
                ["active"]
            ]);
        });

        it("should handle empty object", () => {
            const obj = {};
            const result = convertSearchObjToSearchArray(obj);
            expect(result).toEqual([]);
        });

        it("should handle object with array values", () => {
            const obj = {
                name: "John",
                tags: ["tag1", "tag2"],
                profile: {
                    hobbies: ["reading", "swimming"]
                }
            };
            const result = convertSearchObjToSearchArray(obj);
            // Arrays are not objects, so they should be included as leaf nodes
            expect(result).toEqual([
                ["name"],
                ["tags"],
                ["profile", "hobbies"]
            ]);
        });

        it("should handle deeply nested structure", () => {
            const obj = {
                level1: {
                    level2: {
                        level3: {
                            level4: {
                                final: "value"
                            }
                        }
                    }
                }
            };
            const result = convertSearchObjToSearchArray(obj);
            expect(result).toEqual([
                ["level1", "level2", "level3", "level4", "final"]
            ]);
        });
    });
});