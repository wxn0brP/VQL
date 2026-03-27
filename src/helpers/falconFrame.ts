import type { FFRequest, FFResponse, RouteHandler } from "@wxn0brp/falcon-frame";
import { Router } from "@wxn0brp/falcon-frame";
import type { VQLProcessor } from "../processor";
import { VQLUQ } from "../types/vql";

export type ContextFn = (req: FFRequest, res: FFResponse) => Promise<any> | any;
export type GetQueryFn = (req: FFRequest, res: FFResponse) => Promise<VQLUQ> | VQLUQ;

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

export function FF_VQL(router: Router, processor: VQLProcessor, options: FF_VQL_Options = {}) {
    router.post(options.path || "/VQL", createVqlRouteHandler(processor, options));
}

export function createVqlRouteHandler(processor: VQLProcessor, options: FF_VQL_Options = {}): RouteHandler {
    const getContext = options.getUser || (() => ({}));

    return async (req, res) => {
        try {
            const ctx = await getContext(req, res);
            const query = options.getQuery ? await options.getQuery(req, res) : req.body?.query;
            const result = await processor.execute(query, ctx);
            if (result && result.err) return result;
            return { err: false, result };
        } catch (e) {
            res.status(500);
            return { err: true, msg: formatMessage(e) };
        }
    }
}
