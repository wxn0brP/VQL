import { beforeEach, describe, expect, it } from "bun:test";
import { VQLConfig, VQLProcessor, isVQLError } from "../../src/index";
import {
	VQLDBNotFoundError,
	VQLParseError,
	VQLErrorCodes,
} from "../../src/errors";
import { createE2EProcessor, run } from "./fixture";

describe("E2E - CRUD from a regular user perspective", () => {
	let processor: VQLProcessor;

	beforeEach(() => {
		processor = createE2EProcessor();
	});

	describe("reading data", () => {
		it("finds all records with a minimal VQLS query", async () => {
			const users = await run(processor, "main users");

			expect(users).toHaveLength(4);
			expect(users.map(u => u.name)).toEqual([
				"Mara",
				"Kitty",
				"Harry",
				"Alice",
			]);
		});

		it("filters records and selects only requested fields", async () => {
			const users = await run(
				processor,
				`main users s.status="active" e.name=1`,
			);

			expect(users).toEqual([
				{
					name: "Mara",
				},
				{
					name: "Kitty",
				},
				{
					name: "Alice",
				},
			]);
		});

		it("supports limit and offset", async () => {
			const users = await run(processor, "main users o.limit=2 o.offset=1");

			expect(users.map(u => u.name)).toEqual([
				"Kitty",
				"Harry",
			]);
		});

		it("sorts records", async () => {
			const users = await run(
				processor,
				"main users o.sortBy=age o.sortAsc=true",
			);

			expect(users.map(u => u.age)).toEqual([
				25,
				30,
				35,
				40,
			]);
		});

		it("returns a single record with findOne shorthand", async () => {
			const user = await run(processor, "main users! s._id=2");

			expect(user).toEqual({
				_id: 2,
				name: "Kitty",
				age: 25,
				status: "active",
				companyId: 20,
			});
		});

		it("returns null when findOne has no match", async () => {
			const user = await run(processor, "main users! s._id=999");

			expect(user).toBeNull();
		});

		it("returns an empty array when find has no match", async () => {
			const users = await run(processor, `main users s.name="Nobody"`);

			expect(users).toEqual([]);
		});

		it("executes the same read with VQLR", async () => {
			const users = await run(processor, {
				db: "main",
				d: {
					find: {
						collection: "users",
						search: {
							status: "active",
						},
						select: [
							"name",
							"age",
						],
						options: {
							sortBy: [
								{
									field: "age",
									asc: true,
								},
							],
						},
					},
				},
			});

			expect(users).toEqual([
				{
					name: "Kitty",
					age: 25,
				},
				{
					name: "Mara",
					age: 30,
				},
				{
					name: "Alice",
					age: 35,
				},
			]);
		});
	});

	describe("writing data", () => {
		it("adds a record and reads it back", async () => {
			const added = await run(
				processor,
				`main +users d.name="Zoe" d.age=22 d.status="active"`,
			);

			expect(added.name).toBe("Zoe");
			expect(added._id).toBeDefined();

			const found = await run(processor, `main users! s.name="Zoe"`);

			expect(found).toMatchObject({
				name: "Zoe",
				age: 22,
				status: "active",
			});
		});

		it("updates one record with VQLS", async () => {
			const updated = await run(
				processor,
				`main ~users! s._id=1 u.status="blocked" u.age=31`,
			);

			expect(updated).toMatchObject({
				_id: 1,
				name: "Mara",
				status: "blocked",
				age: 31,
			});

			const found = await run(processor, "main users! s._id=1");

			expect(found.age).toBe(31);
		});

		it("updates many records at once", async () => {
			const updated = await run(
				processor,
				`main ~users s.status="active" u.role="member"`,
			);

			expect(updated).toHaveLength(3);
			expect(updated.every(u => u.role === "member")).toBe(true);
		});

		it("inserts a record with VQLR", async () => {
			const added = await run(processor, {
				db: "main",
				d: {
					add: {
						collection: "users",
						data: {
							_id: 50,
							name: "Oscar",
							age: 28,
							status: "active",
						},
					},
				},
			});

			expect(added).toMatchObject({
				_id: 50,
				name: "Oscar",
			});
		});

		it("bulk inserts records", async () => {
			const added = await run(processor, {
				db: "main",
				d: {
					bulkAdd: {
						collection: "users",
						datas: [
							{
								_id: 101,
								name: "Bulk A",
							},
							{
								_id: 102,
								name: "Bulk B",
							},
						],
					},
				},
			});

			expect(added).toHaveLength(2);

			const count = await run(processor, "main #users");

			expect(count).toBe(6);
		});

		it("upserts a record: first add, then update", async () => {
			const added = await run(processor, {
				db: "main",
				d: {
					updateOneOrAdd: {
						collection: "profiles",
						search: {
							userId: 1,
						},
						updater: {
							lastSeen: "first",
						},
						add_arg: {
							userId: 1,
							displayName: "Mara",
						},
					},
				},
			});

			expect(added.type).toBe("added");
			expect(added.data).toMatchObject({
				userId: 1,
				displayName: "Mara",
				lastSeen: "first",
			});

			const updated = await run(processor, {
				db: "main",
				d: {
					updateOneOrAdd: {
						collection: "profiles",
						search: {
							userId: 1,
						},
						updater: {
							lastSeen: "second",
						},
					},
				},
			});

			expect(updated.type).toBe("updated");
			expect(updated.data.lastSeen).toBe("second");
			expect(updated.data.displayName).toBe("Mara");
		});

		it("toggles a record on and off", async () => {
			const added = await run(processor, {
				db: "main",
				d: {
					toggleOne: {
						collection: "favorites",
						search: {
							userId: 2,
							itemId: "post-1",
						},
					},
				},
			});

			expect(added.type).toBe("added");

			const removed = await run(processor, {
				db: "main",
				d: {
					toggleOne: {
						collection: "favorites",
						search: {
							userId: 2,
							itemId: "post-1",
						},
					},
				},
			});

			expect(removed.type).toBe("removed");

			const left = await run(processor, "main #favorites");

			expect(left).toBe(0);
		});

		it("removes one record", async () => {
			const removed = await run(processor, "main -users! s._id=3");

			expect(removed).toMatchObject({
				_id: 3,
				name: "Harry",
			});

			const found = await run(processor, "main users! s._id=3");

			expect(found).toBeNull();
		});

		it("removes many records by filter", async () => {
			const removed = await run(processor, `main -users s.status="inactive"`);

			expect(removed).toHaveLength(1);

			const count = await run(processor, "main #users");

			expect(count).toBe(3);
		});

		it("counts records with and without a filter", async () => {
			expect(await run(processor, "main #users")).toBe(4);
			expect(await run(processor, `main #users s.status="active"`)).toBe(3);
			expect(await run(processor, "main #users s.age>100")).toBe(0);
		});
	});

	describe("variables and user context", () => {
		it("replaces $_me with the user id", async () => {
			const users = await run(
				processor,
				{
					query: "main users s._id=$_me e.name=1",
					var: {},
				},
				{
					_id: 1,
					role: "user",
				},
			);

			expect(users).toEqual([
				{
					name: "Mara",
				},
			]);
		});

		it("replaces custom variables", async () => {
			const users = await run(processor, {
				query: "main users s.age>$minAge e.name=1 e.age=1",
				var: {
					minAge: 29,
				},
			});

			expect(users).toEqual([
				{
					name: "Mara",
					age: 30,
				},
				{
					name: "Harry",
					age: 40,
				},
				{
					name: "Alice",
					age: 35,
				},
			]);
		});

		it("stores the current user through reference objects in VQLR", async () => {
			const added = await run(
				processor,
				{
					db: "main",
					d: {
						add: {
							collection: "audit",
							data: {
								action: "login",
								userId: {
									__: "_me",
								},
								at: {
									__: "_now",
								},
							},
						},
					},
				},
				{
					_id: 7,
					role: "user",
				},
			);

			expect(added.userId).toBe(7);
			expect(typeof added.at).toBe("number");
		});
	});

	describe("multiple databases and collections", () => {
		it("writes to and reads from a second database", async () => {
			await run(processor, `analytics +events d.type="logout" d.userId=1`);

			const events = await run(
				processor,
				`analytics events s.type="logout" e.type=1 e.userId=1`,
			);

			expect(events).toEqual([
				{
					type: "logout",
					userId: 1,
				},
			]);
		});

		it("manages collections from a query", async () => {
			const before = await run(processor, "main issetCollection logs");

			expect(before).toBe(false);

			await run(processor, "main ensureCollection logs");

			expect(await run(processor, "main issetCollection logs")).toBe(true);

			const collections = await run(processor, "main getCollections");

			expect(collections).toContain("users");
			expect(collections).toContain("logs");

			await run(processor, "main removeCollection logs");

			expect(await run(processor, "main issetCollection logs")).toBe(false);
		});
	});

	describe("error handling", () => {
		it("returns a VQL parse error instead of throwing", async () => {
			const result = await processor.execute("broken");

			expect(isVQLError(result)).toBe(true);
			expect(result).toBeInstanceOf(VQLParseError);
			expect((result as VQLParseError).code).toBe(VQLErrorCodes.QUERY_PARSE);
		});

		it("returns an error for an unknown database", async () => {
			const result = await processor.execute("missing users");

			expect(isVQLError(result)).toBe(true);
			expect(result).toBeInstanceOf(VQLDBNotFoundError);
			expect((result as VQLDBNotFoundError).code).toBe(
				VQLErrorCodes.DB_NOT_FOUND,
			);
		});

		it("returns an error for an invalid query object", async () => {
			const result = await processor.execute({} as any);

			expect(isVQLError(result)).toBe(true);
		});

		it("does not crash when a record is missing during update", async () => {
			const result = await run(
				processor,
				`main ~users! s._id=999 u.name="Nobody"`,
			);

			expect(result).toBeNull();
		});
	});

	describe("configuration", () => {
		it("works with a custom config created by a user", async () => {
			const custom = new VQLProcessor(
				{
					main: createE2EProcessor().dbInstances.main,
				},
				new VQLConfig({
					hidePath: true,
				}),
			);

			const users = await run(custom, "main users s._id=1");

			expect(users).toHaveLength(1);
		});
	});
});
