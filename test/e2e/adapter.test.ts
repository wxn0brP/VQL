import { beforeEach, describe, expect, it } from "bun:test";
import { createMemoryValthera } from "@wxn0brp/db-core";
import {
	VQLProcessor,
	createValtheraAdapter,
	isVQLError,
} from "../../src/index";
import { createVqlRouteHandler } from "../../src/helpers/falconFrame";
import { VQLParseError, VQLErrorCodes } from "../../src/errors";
import { run } from "./fixture";

function createRemoteProcessor() {
	const backing = createMemoryValthera({
		products: [
			{
				_id: "p1",
				name: "Laptop",
				price: 1200,
			},
			{
				_id: "p2",
				name: "Mouse",
				price: 25,
			},
			{
				_id: "p3",
				name: "Keyboard",
				price: 80,
			},
		],
	});

	const adapter = createValtheraAdapter({
		find: query => backing.find(query),
		findOne: query => backing.findOne(query),
		add: query => backing.add(query),
		count: query => backing.count(query),
	});

	return new VQLProcessor({
		remote: adapter,
	});
}

describe("E2E - adapters and HTTP endpoint from a regular user perspective", () => {
	describe("createValtheraAdapter", () => {
		let processor: VQLProcessor;

		beforeEach(() => {
			processor = createRemoteProcessor();
		});

		it("reads through an adapter", async () => {
			const products = await run(
				processor,
				`remote products s.price>50 e.name=1 e.price=1`,
			);

			expect(products).toEqual([
				{
					name: "Laptop",
					price: 1200,
				},
				{
					name: "Keyboard",
					price: 80,
				},
			]);
		});

		it("writes and counts through an adapter", async () => {
			const added = await run(
				processor,
				`remote +products d.name="Cable" d.price=10`,
			);

			expect(added.name).toBe("Cable");

			expect(await run(processor, "remote #products")).toBe(4);
		});

		it("applies reverse and limit when extendedFind is enabled", async () => {
			const adapter = createValtheraAdapter(
				{
					find: async () => [
						{
							_id: 1,
							name: "A",
						},
						{
							_id: 2,
							name: "B",
						},
						{
							_id: 3,
							name: "C",
						},
					],
				},
				true,
			);

			const custom = new VQLProcessor({
				remote: adapter,
			});

			const rows = await run(custom, {
				db: "remote",
				d: {
					find: {
						collection: "anything",
						options: {
							reverse: true,
							limit: 2,
						},
					},
				},
			});

			expect(rows.map(r => r.name)).toEqual([
				"C",
				"B",
			]);
		});
	});

	describe("HTTP route handler", () => {
		function createRes() {
			const calls: number[] = [];
			return {
				calls,
				status(code: number) {
					calls.push(code);
					return this;
				},
			};
		}

		it("returns a successful payload for a user query", async () => {
			const processor = createRemoteProcessor();
			const handler = createVqlRouteHandler(processor);
			const res = createRes();

			const body = await handler(
				{
					body: {
						query: 'remote products s._id="p1"',
					},
				} as any,
				res as any,
				async () => {},
			);

			expect(body).toEqual({
				err: false,
				result: [
					{
						_id: "p1",
						name: "Laptop",
						price: 1200,
					},
				],
			});
			expect(res.calls).toEqual([]);
		});

		it("returns a structured error for a bad query", async () => {
			const processor = createRemoteProcessor();
			const handler = createVqlRouteHandler(processor);
			const res = createRes();

			const body = await handler(
				{
					body: {
						query: "broken",
					},
				} as any,
				res as any,
				async () => {},
			);

			expect(body).toMatchObject({
				err: true,
				c: 400,
				code: VQLErrorCodes.QUERY_PARSE,
			});
			expect(res.calls).toEqual([
				400,
			]);
		});

		it("returns the error object when execute is called directly", async () => {
			const processor = createRemoteProcessor();
			const result = await processor.execute("broken");

			expect(isVQLError(result)).toBe(true);
			expect(result).toBeInstanceOf(VQLParseError);
		});
	});
});
