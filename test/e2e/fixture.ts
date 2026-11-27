import { createMemoryValthera } from "@wxn0brp/db-core";
import { VQLProcessor, isVQLError } from "../../src/index";
import type { VQLUQ } from "../../src/types/vql";

export function createE2EProcessor() {
	const main = createMemoryValthera({
		users: [
			{
				_id: 1,
				name: "Mara",
				age: 30,
				status: "active",
				companyId: 10,
			},
			{
				_id: 2,
				name: "Kitty",
				age: 25,
				status: "active",
				companyId: 20,
			},
			{
				_id: 3,
				name: "Harry",
				age: 40,
				status: "inactive",
				companyId: 30,
			},
			{
				_id: 4,
				name: "Alice",
				age: 35,
				status: "active",
				companyId: 10,
			},
		],
		companies: [
			{
				_id: 10,
				name: "Acme",
			},
			{
				_id: 20,
				name: "Globex",
			},
			{
				_id: 30,
				name: "Initech",
			},
		],
		orders: [
			{
				_id: 100,
				customerId: 1,
				status: "pending",
				total: 50,
			},
			{
				_id: 200,
				customerId: 2,
				status: "shipped",
				total: 100,
			},
			{
				_id: 300,
				customerId: 1,
				status: "delivered",
				total: 75,
			},
		],
		posts: [
			{
				_id: 1,
				title: "Post 1",
				authorId: 1,
				status: "published",
			},
			{
				_id: 2,
				title: "Post 2",
				authorId: 2,
				status: "draft",
			},
			{
				_id: 3,
				title: "Post 3",
				authorId: 3,
				status: "published",
			},
		],
		tags: [
			{
				_id: "t1",
				name: "news",
			},
			{
				_id: "t2",
				name: "tech",
			},
			{
				_id: "t3",
				name: "life",
			},
		],
		post_tags: [
			{
				postId: 1,
				tagId: "t1",
			},
			{
				postId: 1,
				tagId: "t2",
			},
			{
				postId: 2,
				tagId: "t2",
			},
		],
	});

	const analytics = createMemoryValthera({
		events: [
			{
				_id: "e1",
				userId: 1,
				type: "login",
			},
			{
				_id: "e2",
				userId: 2,
				type: "view",
			},
			{
				_id: "e3",
				userId: 1,
				type: "purchase",
			},
		],
	});

	return new VQLProcessor({
		main,
		analytics,
	});
}

export async function run<T = any>(
	processor: VQLProcessor,
	query: VQLUQ<any>,
	user?: any,
): Promise<T> {
	const result = await processor.execute<T>(query, user);
	if (isVQLError(result)) throw result;
	return result as T;
}
