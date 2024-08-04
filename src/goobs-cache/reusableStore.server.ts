/**
 * @file ReusableStore.server.ts
 * @description Implements server-side caching functionality with serverless storage interface.
 */
'use server';

import { createLogger, format, transports } from 'winston';
import ServerlessCache, { createServerlessCache } from '../cache/serverless.server';
import {
  ServerlessCacheConfig,
  DataValue,
  CacheMode,
  CacheResult,
  EvictionPolicy,
  GlobalConfig,
} from '../types';
import path from 'path';

let logger: ReturnType<typeof createLogger> | null = null;

function initializeLogger(globalConfig: GlobalConfig) {
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
      defaultMeta: { service: 'reusable-store-server' },
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
          filename: path.join(globalConfig.logDirectory, 'reusable-store-error.log'),
          level: 'error',
        }),
        new transports.File({
          filename: path.join(globalConfig.logDirectory, 'reusable-store-combined.log'),
        }),
      ],
    });
  }
}

let serverlessCache: ServerlessCache | null = null;

async function initializeServerlessCache(
  config: ServerlessCacheConfig,
  globalConfig: GlobalConfig,
): Promise<ServerlessCache> {
  const startTime = process.hrtime();
  if (!logger) {
    initializeLogger(globalConfig);
  }
  logger!.debug('Initializing serverless cache...', {
    config: { ...config, encryptionPassword: '[REDACTED]' },
    currentInstance: serverlessCache ? 'exists' : 'null',
  });

  try {
    if (!serverlessCache) {
      const encryptionPassword =
        process.env.ENCRYPTION_PASSWORD || config.encryption.encryptionPassword;
      serverlessCache = createServerlessCache(config, encryptionPassword, globalConfig);
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1e6;
      logger!.info('Serverless cache initialized successfully.', {
        duration: `${duration.toFixed(2)}ms`,
        cacheConfig: { ...config, encryptionPassword: '[REDACTED]' },
      });
    } else {
      logger!.debug('Serverless cache already initialized, reusing existing instance.');
    }
    return serverlessCache;
  } catch (error) {
    logger!.error('Failed to initialize serverless cache', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      config: { ...config, encryptionPassword: '[REDACTED]' },
    });
    throw error;
  }
}

export async function serverlessSet(
  identifier: string,
  storeName: string,
  value: DataValue,
  expirationDate: Date,
  mode: CacheMode,
  config: ServerlessCacheConfig,
  globalConfig: GlobalConfig,
): Promise<void> {
  const startTime = process.hrtime();
  if (!logger) {
    initializeLogger(globalConfig);
  }
  logger!.info('Setting value in serverless cache', {
    identifier,
    storeName,
    mode,
    valueType: typeof value,
    expirationDate: expirationDate.toISOString(),
  });

  try {
    if (mode !== 'serverless') {
      throw new Error(`Invalid cache mode for serverless caching: ${mode}`);
    }

    const cache = await initializeServerlessCache(config, globalConfig);
    await cache.set(identifier, storeName, value, expirationDate);

    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1e6;
    logger!.info('Value set successfully in serverless cache.', {
      identifier,
      storeName,
      valueType: typeof value,
      expirationDate: expirationDate.toISOString(),
      duration: `${duration.toFixed(2)}ms`,
    });
  } catch (error) {
    logger!.error('Failed to set value in serverless cache', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      identifier,
      storeName,
      mode,
    });
    throw error;
  }
}

export async function serverlessGet(
  identifier: string,
  storeName: string,
  mode: CacheMode,
  config: ServerlessCacheConfig,
  globalConfig: GlobalConfig,
): Promise<CacheResult> {
  const startTime = process.hrtime();
  if (!logger) {
    initializeLogger(globalConfig);
  }
  logger!.info('Getting value from serverless cache', {
    identifier,
    storeName,
    mode,
  });

  try {
    if (mode !== 'serverless') {
      throw new Error(`Invalid cache mode for serverless caching: ${mode}`);
    }

    const cache = await initializeServerlessCache(config, globalConfig);
    const result = await cache.get(identifier, storeName);

    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1e6;

    if (result.value !== undefined) {
      logger!.info('Value retrieved successfully from serverless cache.', {
        identifier,
        storeName,
        valueType: typeof result.value,
        expirationDate: result.expirationDate.toISOString(),
        lastUpdatedDate: result.lastUpdatedDate.toISOString(),
        lastAccessedDate: result.lastAccessedDate.toISOString(),
        getHitCount: result.getHitCount,
        setHitCount: result.setHitCount,
        duration: `${duration.toFixed(2)}ms`,
      });
    } else {
      logger!.warn('Value not found in serverless cache.', {
        identifier,
        storeName,
        duration: `${duration.toFixed(2)}ms`,
      });
    }

    return result;
  } catch (error) {
    logger!.error('Failed to get value from serverless cache', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      identifier,
      storeName,
      mode,
    });
    throw error;
  }
}

export async function serverlessRemove(
  identifier: string,
  storeName: string,
  mode: CacheMode,
  config: ServerlessCacheConfig,
  globalConfig: GlobalConfig,
): Promise<void> {
  const startTime = process.hrtime();
  if (!logger) {
    initializeLogger(globalConfig);
  }
  logger!.info('Removing value from serverless cache', {
    identifier,
    storeName,
    mode,
  });

  try {
    if (mode !== 'serverless') {
      throw new Error(`Invalid cache mode for serverless caching: ${mode}`);
    }

    const cache = await initializeServerlessCache(config, globalConfig);
    await cache.remove(identifier, storeName);

    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1e6;
    logger!.info('Value removed successfully from serverless cache.', {
      identifier,
      storeName,
      duration: `${duration.toFixed(2)}ms`,
    });
  } catch (error) {
    logger!.error('Failed to remove value from serverless cache', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      identifier,
      storeName,
      mode,
    });
    throw error;
  }
}

export async function serverlessClear(
  config: ServerlessCacheConfig,
  globalConfig: GlobalConfig,
): Promise<void> {
  const startTime = process.hrtime();
  if (!logger) {
    initializeLogger(globalConfig);
  }
  logger!.info('Clearing all values from serverless cache');

  try {
    const cache = await initializeServerlessCache(config, globalConfig);
    await cache.clear();

    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1e6;
    logger!.info('All values cleared successfully from serverless cache.', {
      duration: `${duration.toFixed(2)}ms`,
    });
  } catch (error) {
    logger!.error('Failed to clear all values from serverless cache', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export async function serverlessSetEvictionPolicy(
  policy: EvictionPolicy,
  config: ServerlessCacheConfig,
  globalConfig: GlobalConfig,
): Promise<void> {
  const startTime = process.hrtime();
  if (!logger) {
    initializeLogger(globalConfig);
  }
  logger!.info('Setting eviction policy for serverless cache', { policy });

  try {
    const cache = await initializeServerlessCache(config, globalConfig);
    await cache.setEvictionPolicy(policy);

    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1e6;
    logger!.info('Eviction policy set successfully for serverless cache.', {
      policy,
      duration: `${duration.toFixed(2)}ms`,
    });
  } catch (error) {
    logger!.error('Failed to set eviction policy for serverless cache', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      policy,
    });
    throw error;
  }
}

export function initializeServerlessModule(
  config: ServerlessCacheConfig,
  globalConfig: GlobalConfig,
): void {
  initializeLogger(globalConfig);
  logger!.info('Serverless cache module initialized', {
    config: { ...config, encryptionPassword: '[REDACTED]' },
    globalConfig: { ...globalConfig, encryptionPassword: '[REDACTED]' },
  });
  void initializeServerlessCache(config, globalConfig);
}

process.on('uncaughtException', (error: Error) => {
  if (!logger) {
    const globalConfig: GlobalConfig = {
      loggingEnabled: true,
      logLevel: 'error',
      logDirectory: 'logs',
    };
    initializeLogger(globalConfig);
  }
  logger!.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
  });
  // Gracefully exit the process after logging
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  if (!logger) {
    const globalConfig: GlobalConfig = {
      loggingEnabled: true,
      logLevel: 'error',
      logDirectory: 'logs',
    };
    initializeLogger(globalConfig);
  }
  logger!.error('Unhandled Rejection at:', {
    promise,
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

export { logger as serverlessLogger };
