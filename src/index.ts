import { VQLProcessor } from "./processor";
import { VQLConfig } from "./config";
import { createValtheraAdapter } from "./apiAbstract";
import logger from "./logger";
import { LogLevel } from "@wxn0brp/lucerna-log";
import { FF_VQL } from "./falconFrame";
import { createGwValidFn } from "./gw";

export default VQLProcessor;
export {
    VQLProcessor,
    createValtheraAdapter,
    VQLConfig,
    logger as VQLLogger,
    LogLevel as VQLLogLevel,
    FF_VQL,
    createGwValidFn
}