import type { FFRequest, FFResponse, RouteHandler } from "@wxn0brp/falcon-frame";
import { Router } from "@wxn0brp/falcon-frame";
import type { VQLProcessor } from "../processor.js";
export type ContextFn = (req: FFRequest, res: FFResponse) => Promise<any> | any;
interface FF_VQL_Options {
    /** @default "/VQL" */
    path?: string;
    getUser?: ContextFn;
    /** @deprecated */
    dev?: boolean;
}
export declare function FF_VQL(router: Router, processor: VQLProcessor, options?: FF_VQL_Options): void;
export declare function createVqlRouteHandler(processor: VQLProcessor, options?: FF_VQL_Options): RouteHandler;
export {};
