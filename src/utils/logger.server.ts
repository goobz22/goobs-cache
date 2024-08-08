import { createLogger, format, transports, Logger } from 'winston';
import { GlobalConfig } from '../types';
import path from 'path';
import { promises as fs } from 'fs';

let logger: Logger;

async function createLogDirectory(logDirectory: string): Promise<void> {
  try {
    await fs.mkdir(logDirectory, { recursive: true });
  } catch (error) {
    if ((error as { code?: string }).code !== 'EEXIST') {
      throw error;
    }
  }
}

async function initializeLogger(globalConfig: GlobalConfig): Promise<void> {
  if (!logger) {
    await createLogDirectory(globalConfig.logDirectory);
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
      defaultMeta: { service: 'serverless-cache' },
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
        new transports.File({
          filename: path.join(globalConfig.logDirectory, 'serverless-cache-error.log'),
          level: 'error',
        }),
        new transports.File({
          filename: path.join(globalConfig.logDirectory, 'serverless-cache-combined.log'),
        }),
      ],
    });
  }
}

async function getLogger(): Promise<Logger> {
  if (!logger) {
    throw new Error('Logger not initialized. Call initializeLogger first.');
  }
  return logger;
}

type LogMetadata = Record<string, unknown>;

async function debug(message: string, metadata?: LogMetadata): Promise<void> {
  const logger = await getLogger();
  logger.debug(message, metadata);
}

async function info(message: string, metadata?: LogMetadata): Promise<void> {
  const logger = await getLogger();
  logger.info(message, metadata);
}

async function warn(message: string, metadata?: LogMetadata): Promise<void> {
  const logger = await getLogger();
  logger.warn(message, metadata);
}

async function error(message: string, metadata?: LogMetadata): Promise<void> {
  const logger = await getLogger();
  logger.error(message, metadata);
}

export const ServerLogger = {
  initializeLogger,
  debug: async (message: string, metadata?: LogMetadata) => {
    await debug(message, metadata);
  },
  info: async (message: string, metadata?: LogMetadata) => {
    await info(message, metadata);
  },
  warn: async (message: string, metadata?: LogMetadata) => {
    await warn(message, metadata);
  },
  error: async (message: string, metadata?: LogMetadata) => {
    await error(message, metadata);
  },
};
