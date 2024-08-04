import { createLogger, format, transports, Logger } from 'winston';
import ServerlessCache, { createServerlessCache } from './serverless.server';
import SessionStorageCache, { createSessionStorageCache } from './session.client';
import {
  ServerlessCacheConfig,
  SessionCacheConfig,
  CacheResult,
  DataValue,
  TwoLayerMode,
  GlobalConfig,
} from '../types';
import path from 'path';

let logger: Logger;

let serverlessCache: ServerlessCache | null = null;
let sessionStorage: SessionStorageCache | null = null;

const initializeLogger = (globalConfig: GlobalConfig) => {
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
    defaultMeta: { service: 'two-layer-cache' },
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
        filename: path.join(globalConfig.logDirectory, 'two-layer-cache-error.log'),
        level: 'error',
      }),
      new transports.File({
        filename: path.join(globalConfig.logDirectory, 'two-layer-cache-combined.log'),
      }),
    ],
  });
};

const initializeCaches = async (
  serverlessConfig: ServerlessCacheConfig,
  sessionConfig: SessionCacheConfig,
  globalConfig: GlobalConfig,
): Promise<void> => {
  const startTime = process.hrtime();
  logger.info('Initializing caches', {
    serverlessConfig: { ...serverlessConfig, encryptionPassword: '[REDACTED]' },
    sessionConfig: { ...sessionConfig, encryptionPassword: '[REDACTED]' },
  });
  if (!serverlessCache) {
    logger.debug('Creating serverless cache');
    serverlessCache = createServerlessCache(
      serverlessConfig,
      serverlessConfig.encryption.encryptionPassword,
      globalConfig,
    );
    logger.info('Serverless cache created');
  }
  if (!sessionStorage && typeof window !== 'undefined') {
    logger.debug('Creating session storage cache');
    sessionStorage = createSessionStorageCache(sessionConfig, globalConfig);
    logger.info('Session storage cache created');
  }
  const [seconds, nanoseconds] = process.hrtime(startTime);
  const duration = seconds * 1000 + nanoseconds / 1e6;
  logger.debug('Caches initialized', { duration: `${duration.toFixed(2)}ms` });
};

export async function update(
  identifier: string,
  storeName: string,
  value: DataValue,
  serverlessConfig: ServerlessCacheConfig,
  sessionConfig: SessionCacheConfig,
  mode: TwoLayerMode = 'both',
  globalConfig: GlobalConfig,
): Promise<void> {
  const startTime = process.hrtime();
  logger.info('Updating cache', { identifier, storeName, mode });
  await initializeCaches(serverlessConfig, sessionConfig, globalConfig);
  const expirationDate = new Date(Date.now() + serverlessConfig.cacheMaxAge);
  try {
    if (mode === 'serverless' || mode === 'both') {
      logger.debug('Updating serverless cache', { identifier, storeName });
      await serverlessCache!.set(identifier, storeName, value, expirationDate);
      logger.info('Serverless cache updated', { identifier, storeName });
    }
    if ((mode === 'session' || mode === 'both') && typeof window !== 'undefined') {
      logger.debug('Updating session storage', { identifier, storeName });
      sessionStorage!.set(identifier, storeName, value, expirationDate);
      logger.info('Session storage updated', { identifier, storeName });
    }
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1e6;
    logger.debug('Cache update completed', { duration: `${duration.toFixed(2)}ms` });
  } catch (error) {
    logger.error('Error updating cache', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      identifier,
      storeName,
      mode,
    });
    throw error;
  }
}

export async function get(
  identifier: string,
  storeName: string,
  serverlessConfig: ServerlessCacheConfig,
  sessionConfig: SessionCacheConfig,
  mode: TwoLayerMode = 'both',
  globalConfig: GlobalConfig,
): Promise<CacheResult> {
  const startTime = process.hrtime();
  logger.info('Getting from cache', { identifier, storeName, mode });
  await initializeCaches(serverlessConfig, sessionConfig, globalConfig);
  try {
    let result: CacheResult;
    if (mode === 'session' && typeof window !== 'undefined') {
      logger.debug('Getting from session storage', { identifier, storeName });
      result = await new Promise<CacheResult>((resolve) => {
        sessionStorage!.get(identifier, storeName, (res: CacheResult | undefined) => {
          if (res) {
            logger.info('Retrieved from session storage', { identifier, storeName });
            resolve(res);
          } else {
            logger.info('Not found in session storage, returning empty result', {
              identifier,
              storeName,
            });
            resolve(createEmptyResult(identifier, storeName));
          }
        });
      });
    } else if (mode === 'serverless') {
      logger.debug('Getting from serverless cache', { identifier, storeName });
      result = await serverlessCache!.get(identifier, storeName);
      logger.info('Retrieved from serverless cache', { identifier, storeName });
    } else {
      // mode is 'both' or we're on the server side
      if (typeof window !== 'undefined') {
        logger.debug('Attempting to get from session storage first', { identifier, storeName });
        result = await new Promise<CacheResult>((resolve) => {
          sessionStorage!.get(
            identifier,
            storeName,
            async (sessionResult: CacheResult | undefined) => {
              if (sessionResult && sessionResult.value !== undefined) {
                logger.info('Retrieved from session storage', { identifier, storeName });
                resolve(sessionResult);
              } else {
                logger.debug('Not found in session storage, trying serverless cache', {
                  identifier,
                  storeName,
                });
                const serverResult = await serverlessCache!.get(identifier, storeName);
                if (serverResult.value !== undefined) {
                  logger.info('Retrieved from serverless cache', { identifier, storeName });
                  logger.debug('Updating session storage with serverless result', {
                    identifier,
                    storeName,
                  });
                  sessionStorage!.set(
                    identifier,
                    storeName,
                    serverResult.value,
                    serverResult.expirationDate,
                  );
                } else {
                  logger.info('Not found in serverless cache', { identifier, storeName });
                }
                resolve(serverResult);
              }
            },
          );
        });
      } else {
        logger.debug('On server side, getting directly from serverless cache', {
          identifier,
          storeName,
        });
        result = await serverlessCache!.get(identifier, storeName);
        logger.info('Retrieved from serverless cache', { identifier, storeName });
      }
    }
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1e6;
    logger.debug('Cache get operation completed', {
      duration: `${duration.toFixed(2)}ms`,
      resultFound: result.value !== undefined,
    });
    return result;
  } catch (error) {
    logger.error('Error getting from cache', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      identifier,
      storeName,
      mode,
    });
    throw error;
  }
}

export async function remove(
  identifier: string,
  storeName: string,
  serverlessConfig: ServerlessCacheConfig,
  sessionConfig: SessionCacheConfig,
  mode: TwoLayerMode = 'both',
  globalConfig: GlobalConfig,
): Promise<void> {
  const startTime = process.hrtime();
  logger.info('Removing from cache', { identifier, storeName, mode });
  await initializeCaches(serverlessConfig, sessionConfig, globalConfig);
  try {
    if (mode === 'serverless' || mode === 'both') {
      logger.debug('Removing from serverless cache', { identifier, storeName });
      await serverlessCache!.remove(identifier, storeName);
      logger.info('Removed from serverless cache', { identifier, storeName });
    }
    if ((mode === 'session' || mode === 'both') && typeof window !== 'undefined') {
      logger.debug('Removing from session storage', { identifier, storeName });
      sessionStorage!.remove(identifier, storeName);
      logger.info('Removed from session storage', { identifier, storeName });
    }
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1e6;
    logger.debug('Cache remove operation completed', { duration: `${duration.toFixed(2)}ms` });
  } catch (error) {
    logger.error('Error removing from cache', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      identifier,
      storeName,
      mode,
    });
    throw error;
  }
}

function createEmptyResult(identifier: string, storeName: string): CacheResult {
  logger.debug('Creating empty result', { identifier, storeName });
  return {
    identifier,
    storeName,
    value: undefined,
    expirationDate: new Date(0),
    lastUpdatedDate: new Date(0),
    lastAccessedDate: new Date(0),
    getHitCount: 0,
    setHitCount: 0,
  };
}

export function initializeTwoLayerModule(
  serverlessConfig: ServerlessCacheConfig,
  sessionConfig: SessionCacheConfig,
  globalConfig: GlobalConfig,
): void {
  initializeLogger(globalConfig);
  logger.info('Two-layer cache module initialized', {
    serverlessConfig: { ...serverlessConfig, encryptionPassword: '[REDACTED]' },
    sessionConfig: { ...sessionConfig, encryptionPassword: '[REDACTED]' },
    globalConfig: { ...globalConfig, encryptionPassword: '[REDACTED]' },
  });
  void initializeCaches(serverlessConfig, sessionConfig, globalConfig);
}

// Add an unhandled rejection handler
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

export { logger as twoLayerLogger };
