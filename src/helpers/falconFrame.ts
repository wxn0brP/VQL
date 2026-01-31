import { parseVQLS } from "../cpu/string";
import { type VQLProcessor } from "../processor";
import type { FalconFrame, FFRequest, FFResponse } from "@wxn0brp/falcon-frame";

export type ContextFn = (req: FFRequest, res: FFResponse) => Promise<any> | any;

interface FF_VQL_Options {
    /** @default "/VQL" */
    path?: string;
    getUser?: ContextFn;
    dev?: boolean;
}

function formatMessage(e: any) {
    return e instanceof Error
        ? e.message
        : typeof e === "string"
            ? e
            : JSON.stringify(e);
}

export function FF_VQL(app: FalconFrame<any>, processor: VQLProcessor, options: FF_VQL_Options = {}) {
    const path = options.path || "/VQL";
    const getContext = options.getUser || (() => ({}));

    app.post(path, async (req, res) => {
        try {
            const ctx = await getContext(req, res);
            const result = await processor.execute(req.body.query, ctx);
            if (result && result.err) return result;
            return { err: false, result };
        } catch (e) {
            res.status(500);
            return { err: true, msg: formatMessage(e) };
        }
    });

    if (options.dev) {
        app.get(path + "-query", (req, res) => {
            try {
                return parseVQLS(req.query?.query || "");
            } catch (e) {
                res.status(500);
                return { err: true, msg: formatMessage(e) };
            }
        });
    }
}
