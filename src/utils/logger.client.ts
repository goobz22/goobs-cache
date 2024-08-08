import { createLogger, format, transports, Logger } from 'winston';
import { GlobalConfig } from '../types';

let logger: Logger;

function initializeLogger(globalConfig: GlobalConfig): void {
  if (!logger) {
    logger = createLogger({
      level: globalConfig.logLevel,
      silent: !globalConfig.loggingEnabled,
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.json(),
        format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
      ),
      defaultMeta: { service: 'client' },
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(({ level, message, timestamp, metadata }) => {
              let msg = `${timestamp} [${level}]: ${message}`;
              if (Object.keys(metadata).length > 0) {
                msg += '\n\t' + JSON.stringify(metadata);
              }
              return msg;
            }),
          ),
        }),
      ],
    });
  }
}

function getLogger(): Logger {
  if (!logger) {
    throw new Error('Logger not initialized. Call initializeLogger first.');
  }
  return logger;
}

type LogMetadata = Record<string, unknown>;

function debug(message: string, metadata?: LogMetadata): void {
  const logger = getLogger();
  logger.debug(message, metadata);
}

function info(message: string, metadata?: LogMetadata): void {
  const logger = getLogger();
  logger.info(message, metadata);
}

function warn(message: string, metadata?: LogMetadata): void {
  const logger = getLogger();
  logger.warn(message, metadata);
}

function error(message: string, metadata?: LogMetadata): void {
  const logger = getLogger();
  logger.error(message, metadata);
}

export const ClientLogger = {
  initializeLogger,
  debug,
  info,
  warn,
  error,
};
