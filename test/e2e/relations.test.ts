import { beforeEach, describe, expect, it } from "bun:test";
import type { VQLProcessor } from "../../src/index";
import { createE2EProcessor, run } from "./fixture";

describe("E2E - relations from a regular user perspective", () => {
	let processor: VQLProcessor;

	beforeEach(() => {
		processor = createE2EProcessor();
	});

	it("joins orders with their customers using VQLR", async () => {
		const orders = await run(processor, {
			r: {
				path: [
					"main",
					"orders",
				],
				search: {},
				many: true,
				relations: {
					customer: {
						path: [
							"main",
							"users",
						],
						type: "1",
						pk: "customerId",
						fk: "_id",
						select: [
							"name",
							"age",
						],
					},
				},
			},
		});

		expect(orders).toHaveLength(3);
		expect(orders[0]).toMatchObject({
			_id: 100,
			customer: {
				name: "Mara",
				age: 30,
			},
		});
		expect(orders[1].customer.name).toBe("Kitty");
	});

	it("joins a parent with many children using type 1n", async () => {
		const users = await run(processor, {
			r: {
				path: [
					"main",
					"users",
				],
				search: {
					_id: 1,
				},
				many: true,
				relations: {
					orders: {
						path: [
							"main",
							"orders",
						],
						type: "1n",
						pk: "_id",
						fk: "customerId",
						select: [
							"total",
							"status",
						],
					},
				},
			},
		});

		expect(users).toHaveLength(1);
		expect(users[0].orders).toHaveLength(2);
		expect(users[0].orders.map(o => o.total)).toEqual([
			50,
			75,
		]);
	});

	it("joins many-to-many records through a pivot collection", async () => {
		const post = await run(processor, {
			r: {
				path: [
					"main",
					"posts",
				],
				search: {
					_id: 1,
				},
				relations: {
					tags: {
						path: [
							"main",
							"tags",
						],
						type: "nm",
						pk: "_id",
						fk: "_id",
						through: {
							table: "post_tags",
							db: "main",
							pk: "postId",
							fk: "tagId",
						},
					},
				},
			},
		});

		expect(post.tags).toHaveLength(2);
		expect(post.tags.map(t => t.name).sort()).toEqual(
			[
				"news",
				"tech",
			].sort(),
		);
	});

	it("supports nested relations", async () => {
		const orders = await run(processor, {
			r: {
				path: [
					"main",
					"orders",
				],
				search: {
					_id: 100,
				},
				relations: {
					customer: {
						path: [
							"main",
							"users",
						],
						pk: "customerId",
						fk: "_id",
						relations: {
							company: {
								path: [
									"main",
									"companies",
								],
								pk: "companyId",
								fk: "_id",
								select: [
									"name",
								],
							},
						},
					},
				},
			},
		});

		expect(orders.customer.name).toBe("Mara");
		expect(orders.customer.company).toEqual({
			name: "Acme",
		});
	});

	it("joins data across two databases", async () => {
		const events = await run(processor, {
			r: {
				path: [
					"analytics",
					"events",
				],
				search: {},
				many: true,
				relations: {
					user: {
						path: [
							"main",
							"users",
						],
						pk: "userId",
						fk: "_id",
						select: [
							"name",
						],
					},
				},
			},
		});

		expect(events).toHaveLength(3);
		expect(events[0].user).toEqual({
			name: "Mara",
		});
		expect(events[1].user.name).toBe("Kitty");
	});

	it("keeps only selected relation paths in the result", async () => {
		const orders = await run(processor, {
			r: {
				path: [
					"main",
					"orders",
				],
				search: {},
				many: true,
				relations: {
					customer: {
						path: [
							"main",
							"users",
						],
						pk: "customerId",
						fk: "_id",
						select: [
							"name",
						],
					},
				},
				select: [
					[
						"_id",
					],
					[
						"customer",
						"name",
					],
				],
			},
		});

		expect(orders[0]).toEqual({
			_id: 100,
			customer: {
				name: "Mara",
			},
		});
	});

	it("builds the same relation query with VQLS", async () => {
		const orders = await run(
			processor,
			`main orders s._id=100` +
				` r.customer.path=["main","users"]` +
				` r.customer.pk="customerId"` +
				` r.customer.fk="_id"` +
				` r.customer.select=["name","age"]`,
		);

		expect(orders).toMatchObject({
			_id: 100,
			customer: {
				name: "Mara",
				age: 30,
			},
		});
	});
});
