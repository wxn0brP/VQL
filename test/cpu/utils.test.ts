import { VQLConfig } from "#helpers/config";
import { parseSelect } from "#cpu/utils";
import { describe, expect, it } from "bun:test";

describe("CPU/Utils", () => {
    describe("parseSelect", () => {
        describe("when config.strictSelect is true", () => {
            const config = new VQLConfig({ strictSelect: true });

            it("should handle non-object, non-array input", () => {
                const result = parseSelect(config, 123 as any); // number instead of null
                // With strictSelect = true, should return []
                expect(result).toEqual([]);
            });

            it("should return the array for array input when strictSelect is true", () => {
                const arrayInput = ["field1", "field2"];
                const result = parseSelect(config, arrayInput);
                expect(result).toBe(arrayInput); // Should return same reference
            });

            it("should return filtered keys for object input when strictSelect is true", () => {
                const objectInput = { field1: true, field2: false, field3: 1, field4: 0 };
                const result = parseSelect(config, objectInput);
                expect(result).toEqual(["field1", "field3"]);
            });

            it("should return filtered keys for object with falsy values when strictSelect is true", () => {
                const objectInput = { field1: false, field2: null, field3: "", field4: 0 };
                const result = parseSelect(config, objectInput);
                expect(result).toEqual([]); // All falsy values are filtered out
            });
        });

        describe("when config.strictSelect is false", () => {
            const config = new VQLConfig({ strictSelect: false });

            it("should return undefined for non-object, non-array input", () => {
                // Test with a value that's neither array nor object (like string, number)
                const result = parseSelect(config, "not-an-object" as any);
                expect(result).toBeUndefined();
            });

            it("should return array for non-empty array input", () => {
                const arrayInput = ["field1", "field2"];
                const result = parseSelect(config, arrayInput);
                expect(result).toBe(arrayInput);
            });

            it("should return undefined for empty array input", () => {
                const arrayInput: string[] = [];
                const result = parseSelect(config, arrayInput);
                expect(result).toBeUndefined();
            });

            it("should return filtered keys for non-empty object input", () => {
                const objectInput = { field1: true, field2: false, field3: "value" };
                const result = parseSelect(config, objectInput);
                expect(result).toEqual(["field1", "field3"]);
            });

            it("should return undefined for empty object input", () => {
                const objectInput = {};
                const result = parseSelect(config, objectInput);
                expect(result).toBeUndefined();
            });

            it("should return filtered keys ignoring falsy values", () => {
                const objectInput = { field1: true, field2: false, field3: null, field4: "", field5: 0, field6: 1 };
                const result = parseSelect(config, objectInput);
                expect(result).toEqual(["field1", "field6"]);
            });
        });

        describe("with mixed data types", () => {
            it("should handle array with mixed values when strictSelect is true", () => {
                const config = new VQLConfig({ strictSelect: true });
                const mixedArray = ["field1", null, "field2", undefined, "field3"];
                const result = parseSelect(config, mixedArray);
                expect(result).toBe(mixedArray); // Should return same array, doesn't filter array contents
            });

            it("should handle object with complex values", () => {
                const config = new VQLConfig({ strictSelect: true });
                const complexObject = {
                    field1: true,
                    field2: { nested: true },
                    field3: [1, 2, 3],
                    field4: "string",
                    field5: 42
                };
                const result = parseSelect(config, complexObject);
                expect(result).toEqual(["field1", "field2", "field3", "field4", "field5"]);
            });

            it("should handle object with undefined and null values", () => {
                const config = new VQLConfig({ strictSelect: true });
                const objectWithNulls = {
                    field1: "value",
                    field2: null,
                    field3: undefined,
                    field4: false,
                    field5: "truthy"
                };
                const result = parseSelect(config, objectWithNulls);
                // Only truthy values should be included: "value", "truthy" (empty string and null/undefined/0 are falsy)
                expect(result).toEqual(["field1", "field5"]);
            });
        });
    });
});