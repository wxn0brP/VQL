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
    return async (req, res) => {
        try {
            const ctx = await getContext(req, res);
            const query = options.getQuery ? await options.getQuery(req, res) : req.body?.query;
            const result = await processor.execute(query, ctx);
            if (result && result.err)
                return result;
            return { err: false, result };
        }
        catch (e) {
            res.status(500);
            return { err: true, msg: formatMessage(e) };
        }
    };
}
