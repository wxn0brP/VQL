import winston from "winston";

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'data/execution.log' })
    ]
});

export function logLog(instanceName: string, message: any) {
    const logMessage = `[${instanceName}] ${message}`;
    logger.info(logMessage);
}

export default logger;