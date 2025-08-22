import { type VQLProcessor } from "./processor.js";
import type { FalconFrame, FFRequest } from "@wxn0brp/falcon-frame";
type ContextFn = (req: FFRequest) => Promise<any> | any;
interface FF_VQL_Options {
    path?: string;
    getUser?: ContextFn;
    dev?: boolean;
}
export declare function FF_VQL(app: FalconFrame, processor: VQLProcessor, options?: FF_VQL_Options): void;
export {};
