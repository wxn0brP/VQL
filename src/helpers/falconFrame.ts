import type {
	FFRequest,
	FFResponse,
	RouteHandler,
} from "@wxn0brp/falcon-frame";
import { Router } from "@wxn0brp/falcon-frame";
import { wrapAdapterError } from "@wxn0brp/db-core/errors";
import type { VQLProcessor } from "../processor";
import { VQLError, isVQLError } from "../errors";
import { VQLUQ } from "../types/vql";

export type ContextFn = (req: FFRequest, res: FFResponse) => Promise<any> | any;
export type GetQueryFn = (
	req: FFRequest,
	res: FFResponse,
) => Promise<VQLUQ> | VQLUQ;

interface FF_VQL_Options {
	/** @default "/VQL" */
	path?: string;
	getUser?: ContextFn;
	getQuery?: GetQueryFn;
	/** @deprecated */
	dev?: boolean;
}

function formatMessage(e: any) {
	return e instanceof Error
		? e.message
		: typeof e === "string"
			? e
			: JSON.stringify(e);
}

export function FF_VQL(
	router: Router,
	processor: VQLProcessor,
	options: FF_VQL_Options = {},
) {
	router.post(
		options.path || "/VQL",
		createVqlRouteHandler(processor, options),
	);
}

export function createVqlRouteHandler(
	processor: VQLProcessor,
	options: FF_VQL_Options = {},
): RouteHandler {
	const getContext = options.getUser || (() => ({}));

	function toErrorResponse(err: unknown) {
		const wrapped = wrapAdapterError(err);
		const statusCode = isVQLError(err) ? (err as VQLError).statusCode : 500;
		return {
			err: true,
			msg: wrapped.message,
			c: statusCode,
			code: wrapped.code,
			...(wrapped.suggestion
				? {
						suggestion: wrapped.suggestion,
					}
				: {}),
			...(wrapped.context
				? {
						context: wrapped.context,
					}
				: {}),
		};
	}

	return async (req, res) => {
		try {
			const ctx = await getContext(req, res);
			const query = options.getQuery
				? await options.getQuery(req, res)
				: req.body?.query;
			const result = await processor.execute(query, ctx);

			if (result instanceof VQLError) {
				res.status(result.statusCode);
				return {
					err: true,
					msg: result.message,
					c: result.statusCode,
					code: result.code,
					...(result.suggestion
						? {
								suggestion: result.suggestion,
							}
						: {}),
					...(result.context
						? {
								context: result.context,
							}
						: {}),
				};
			}

			return {
				err: false,
				result,
			};
		} catch (e) {
			const body = toErrorResponse(e);
			res.status(body.c);
			return body;
		}
	};
}
