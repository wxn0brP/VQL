import { type VQLProcessor } from "../processor.js";
import type { FalconFrame, FFRequest, FFResponse } from "@wxn0brp/falcon-frame";
export type ContextFn = (req: FFRequest, res: FFResponse) => Promise<any> | any;
interface FF_VQL_Options {
    /** @default "/VQL" */
    path?: string;
    getUser?: ContextFn;
    dev?: boolean;
}
export declare function FF_VQL(app: FalconFrame<any>, processor: VQLProcessor, options?: FF_VQL_Options): void;
export {};
