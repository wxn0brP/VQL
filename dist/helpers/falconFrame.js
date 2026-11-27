import { wrapAdapterError } from "@wxn0brp/db-core/errors";
import { VQLError, isVQLError } from "../errors.js";
function formatMessage(e) {
    return e instanceof Error
        ? e.message
        : typeof e === "string"
            ? e
            : JSON.stringify(e);
}
export function FF_VQL(router, processor, options = {}) {
    router.post(options.path || "/VQL", createVqlRouteHandler(processor, options));
}
export function createVqlRouteHandler(processor, options = {}) {
    const getContext = options.getUser || (() => ({}));
    function toErrorResponse(err) {
        const wrapped = wrapAdapterError(err);
        const statusCode = isVQLError(err) ? err.statusCode : 500;
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
        }
        catch (e) {
            const body = toErrorResponse(e);
            res.status(body.c);
            return body;
        }
    };
}
