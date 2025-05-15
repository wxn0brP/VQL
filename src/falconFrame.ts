import { type VQLProcessor } from "./processor";
import type { FalconFrame, FFRequest } from "@wxn0brp/falcon-frame";

type ContextFn = (req: FFRequest) => Promise<any> | any;

interface FF_VQL_Options {
    path?: string; // default = "/VQL"
    getUser?: ContextFn;
}

export function FF_VQL(app: FalconFrame, processor: VQLProcessor, options: FF_VQL_Options = {}) {
    const path = options.path || "/VQL";
    const getContext = options.getUser || (() => ({}));

    app.post(path, async (req, res) => {
        try {
            const ctx = await getContext(req);
            const result = await processor.execute(req.body.query, ctx);
            if (result && result.err) return result;
            return { err: false, result };
        } catch (e) {
            res.status(500);
            return { err: true, msg: e.message };
        }
    });
}
