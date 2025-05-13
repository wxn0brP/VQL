import { ConsoleTransport, FileTransport, Logger } from "@wxn0brp/wts-logger";

const logger = new Logger({
    transports: [
        new ConsoleTransport(),
        new FileTransport("data/execution.log")
    ],
    loggerName: "VQL"
});

export default logger;