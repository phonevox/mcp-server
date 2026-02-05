import winston from "winston";

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, context, ...meta }) => {
    const ctx = context ? `[${context}] ` : "";
    const extra = Object.keys(meta).length > 0 ? JSON.stringify(meta) : "";

    return `${timestamp} ${level}: ${ctx}${message} ${extra}`;
});

export const logger = winston.createLogger({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: combine(colorize(), timestamp({ format: "HH:mm:ss" }), logFormat),
    transports: [new winston.transports.Console()],
});

export const createLogger = (context: string) => ({
    debug: (msg: string, meta?: object) =>
        logger.debug(msg, { context, ...meta }),
    info: (msg: string, meta?: object) =>
        logger.info(msg, { context, ...meta }),
    warn: (msg: string, meta?: object) =>
        logger.warn(msg, { context, ...meta }),
    error: (msg: string, meta?: object) =>
        logger.error(msg, { context, ...meta }),
});
