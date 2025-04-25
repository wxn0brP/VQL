import { ConsoleTransport, FileTransport, Logger } from "@wxn0brp/wts-logger";

const logger = new Logger({
    transports: [
        new ConsoleTransport(),
        new FileTransport("data/execution.log")
    ],
    loggerName: "VQL"
});

export function logLog(instanceName: string, message: any) {
    const logMessage = `[${instanceName}] ${message}`;
    logger.info(logMessage);
}

export default logger;