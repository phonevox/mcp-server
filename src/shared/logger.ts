import winston from "winston";
 
const { combine, timestamp, printf, colorize } = winston.format;

function stripAnsi(str: string): string {
  return str.replace(/\x1B[[@-_][0-?]*[ -/]*[@-~]/g, "");
}

function sanitizeNamespace(ns: string) {
  return ns.replace(/[^a-zA-Z0-9._-]/g, "");
}

const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  printf(({ timestamp, level, message, namespace, ...meta }) => {
    const levelText = stripAnsi(level);
    const paddedText = levelText.toUpperCase().padEnd(6);
    const paddedLevel = level.replace(levelText, paddedText);

    const ns = namespace ? `[${sanitizeNamespace(namespace as string)}] ` : "";
    
    const extra = Object.keys(meta).length > 0
      ? "\n" + JSON.stringify(meta, null, 0)
      : "";

    return `[${timestamp}] [${paddedLevel}] ${ns}${message}${extra}`;
  })
);

const fileFormat = combine(
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  printf(({ timestamp, level, message, namespace, ...meta }) => {
    const paddedLevel = level.toUpperCase().padEnd(7);
    const ns = namespace ? `[${sanitizeNamespace(namespace as string)}] ` : "";
    const extra = Object.keys(meta).length > 0
      ? "\n" + JSON.stringify(meta, null, 2)
      : "";
    return `${timestamp} ${paddedLevel}${ns}${message}${extra}`;
  })
);

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(),
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // new winston.transports.File({
    //   filename: "logs/app.log",
    //   format: fileFormat,
    // }),
    // new winston.transports.File({
    //   filename: "logs/error.log",
    //   level: "error",
    //   format: fileFormat,
    // }),
  ],
});

// export const createLogger = (context: string) => {
//   return {
//     debug: (msg: string, meta?: object) => logger.debug(msg, { context, ...meta }),
//     info:  (msg: string, meta?: object) => logger.info(msg,  { context, ...meta }),
//     warn:  (msg: string, meta?: object) => logger.warn(msg,  { context, ...meta }),
//     error: (msg: string, meta?: object) => logger.error(msg, { context, ...meta }),
//     child: (subcontext: string) => createLogger(`${context}.${subcontext}`),
//   };
// };

export const createLogger = (namespace: string) => {
  const ns = namespace;

  return {
    debug: (msg: string, meta: object = {}) =>
      logger.debug(msg, { namespace: ns, ...meta }),

    info: (msg: string, meta: object = {}) =>
      logger.info(msg, { namespace: ns, ...meta }),

    warn: (msg: string, meta: object = {}) =>
      logger.warn(msg, { namespace: ns, ...meta }),

    error: (msg: string, meta: object = {}) =>
      logger.error(msg, { namespace: ns, ...meta }),

    child: (sub: string) =>
      createLogger(`${ns}.${sub}`),
  };
};


export type LoggerLike = {
    debug: (msg: string, obj?: any) => void;
    info: (msg: string, obj?: any) => void;
    warn: (msg: string, obj?: any) => void;
    error: (msg: string, obj?: any) => void;
    child: (namespace: string) => LoggerLike;
};