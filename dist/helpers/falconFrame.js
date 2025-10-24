import { parseVQLS } from "../cpu/string/index.js";
export function FF_VQL(app, processor, options = {}) {
    const path = options.path || "/VQL";
    const getContext = options.getUser || (() => ({}));
    app.post(path, async (req, res) => {
        try {
            const ctx = await getContext(req);
            const result = await processor.execute(req.body.query, ctx);
            if (result && result.err)
                return result;
            return { err: false, result };
        }
        catch (e) {
            res.status(500);
            return { err: true, msg: e.message };
        }
    });
    if (options.dev) {
        app.get(path + "-query", (req, res) => {
            try {
                return res.json(parseVQLS(req.query?.query || ""));
            }
            catch (e) {
                res.status(500);
                return { err: true, msg: e.message };
            }
        });
    }
}
