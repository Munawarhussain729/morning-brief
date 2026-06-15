import log from "electron-log";

log.transports.file.level = "info";
log.transports.console.level = process.env.NODE_ENV === "development" ? "debug" : "info";

export const logger = {
  debug: (message: string, meta?: unknown) => log.debug(message, meta ?? ""),
  info: (message: string, meta?: unknown) => log.info(message, meta ?? ""),
  warn: (message: string, meta?: unknown) => log.warn(message, meta ?? ""),
  error: (message: string, meta?: unknown) => log.error(message, meta ?? "")
};
