/**
 * @file ReusableStore.client.ts
 * @description Implements client-side caching functionality using cookies and session storage.
 */
'use client';

import { createLogger, format, transports } from 'winston';
import {
  DataValue,
  CookieCacheConfig,
  SessionCacheConfig,
  CacheMode,
  CacheResult,
  GlobalConfig,
} from '../types';
import CookieCache, { createCookieCache } from '../cache/cookie.client';
import SessionStorageCache, { createSessionStorageCache } from '../cache/session.client';

let logger: ReturnType<typeof createLogger>;

function initializeLogger(globalConfig: GlobalConfig) {
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
    defaultMeta: { service: 'reusable-store-client' },
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
      new transports.File({ filename: 'error.log', level: 'error' }),
      new transports.File({ filename: 'combined.log' }),
    ],
  });
}

let cookieCache: CookieCache | null = null;
let sessionStorageCache: SessionStorageCache | null = null;

/**
 * Initializes the client-side caches.
 */
function initializeCaches(
  cookieConfig: CookieCacheConfig,
  sessionConfig: SessionCacheConfig,
  globalConfig: GlobalConfig,
): void {
  const startTime = performance.now();
  logger.info('Initializing client-side caches');
  if (!cookieCache) {
    logger.debug('Creating cookie cache');
    cookieCache = createCookieCache(cookieConfig, globalConfig);
    logger.info('Cookie cache created');
  }
  if (!sessionStorageCache) {
    logger.debug('Creating session storage cache');
    sessionStorageCache = createSessionStorageCache(sessionConfig, globalConfig);
    logger.info('Session storage cache created');
  }
  const duration = performance.now() - startTime;
  logger.debug('Client-side caches initialized', { duration: `${duration.toFixed(2)}ms` });
}

/**
 * Sets a value in the client-side cache (either cookie or session storage).
 */
export function clientSet(
  identifier: string,
  storeName: string,
  value: DataValue,
  expirationDate: Date,
  mode: CacheMode,
  config: CookieCacheConfig | SessionCacheConfig,
  globalConfig: GlobalConfig,
): void {
  const startTime = performance.now();
  logger.info('Setting client-side cache', { identifier, storeName, mode });
  initializeCaches(config as CookieCacheConfig, config as SessionCacheConfig, globalConfig);
  try {
    if (mode === 'cookie') {
      logger.debug('Setting cookie cache', { identifier, storeName });
      cookieCache!.set(identifier, storeName, value, expirationDate);
      logger.info('Cookie cache set', { identifier, storeName });
    } else if (mode === 'session') {
      logger.debug('Setting session storage cache', { identifier, storeName });
      sessionStorageCache!.set(identifier, storeName, value, expirationDate);
      logger.info('Session storage cache set', { identifier, storeName });
    } else {
      throw new Error(`Invalid cache mode for client-side caching: ${mode}`);
    }
    const duration = performance.now() - startTime;
    logger.debug('Client-side cache set operation completed', {
      duration: `${duration.toFixed(2)}ms`,
    });
  } catch (error) {
    logger.error('Error setting client-side cache', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      identifier,
      storeName,
      mode,
    });
    throw error;
  }
}

/**
 * Retrieves a value from the client-side cache (either cookie or session storage).
 */
export function clientGet(
  identifier: string,
  storeName: string,
  mode: CacheMode,
  config: CookieCacheConfig | SessionCacheConfig,
  globalConfig: GlobalConfig,
): Promise<CacheResult> {
  const startTime = performance.now();
  logger.info('Getting from client-side cache', { identifier, storeName, mode });
  initializeCaches(config as CookieCacheConfig, config as SessionCacheConfig, globalConfig);
  return new Promise((resolve) => {
    try {
      if (mode === 'cookie') {
        logger.debug('Getting from cookie cache', { identifier, storeName });
        cookieCache!.get(identifier, storeName, (result: CacheResult | undefined) => {
          if (result) {
            logger.info('Retrieved from cookie cache', { identifier, storeName });
            resolve(result);
          } else {
            logger.info('Not found in cookie cache, returning default result', {
              identifier,
              storeName,
            });
            resolve(createDefaultCacheResult(identifier, storeName));
          }
          const duration = performance.now() - startTime;
          logger.debug('Cookie cache get operation completed', {
            duration: `${duration.toFixed(2)}ms`,
          });
        });
      } else if (mode === 'session') {
        logger.debug('Getting from session storage cache', { identifier, storeName });
        sessionStorageCache!.get(identifier, storeName, (result: CacheResult | undefined) => {
          if (result) {
            logger.info('Retrieved from session storage cache', { identifier, storeName });
            resolve(result);
          } else {
            logger.info('Not found in session storage cache, returning default result', {
              identifier,
              storeName,
            });
            resolve(createDefaultCacheResult(identifier, storeName));
          }
          const duration = performance.now() - startTime;
          logger.debug('Session storage get operation completed', {
            duration: `${duration.toFixed(2)}ms`,
          });
        });
      } else {
        throw new Error(`Invalid cache mode for client-side caching: ${mode}`);
      }
    } catch (error) {
      logger.error('Error getting from client-side cache', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        identifier,
        storeName,
        mode,
      });
      resolve(createDefaultCacheResult(identifier, storeName));
    }
  });
}

function createDefaultCacheResult(identifier: string, storeName: string): CacheResult {
  logger.debug('Creating default cache result', { identifier, storeName });
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

/**
 * Removes a value from the client-side cache (either cookie or session storage).
 */
export function clientRemove(
  identifier: string,
  storeName: string,
  mode: CacheMode,
  config: CookieCacheConfig | SessionCacheConfig,
  globalConfig: GlobalConfig,
): void {
  const startTime = performance.now();
  logger.info('Removing from client-side cache', { identifier, storeName, mode });
  initializeCaches(config as CookieCacheConfig, config as SessionCacheConfig, globalConfig);
  try {
    if (mode === 'cookie') {
      logger.debug('Removing from cookie cache', { identifier, storeName });
      cookieCache!.remove(identifier, storeName);
      logger.info('Removed from cookie cache', { identifier, storeName });
    } else if (mode === 'session') {
      logger.debug('Removing from session storage cache', { identifier, storeName });
      sessionStorageCache!.remove(identifier, storeName);
      logger.info('Removed from session storage cache', { identifier, storeName });
    } else {
      throw new Error(`Invalid cache mode for client-side caching: ${mode}`);
    }
    const duration = performance.now() - startTime;
    logger.debug('Client-side cache remove operation completed', {
      duration: `${duration.toFixed(2)}ms`,
    });
  } catch (error) {
    logger.error('Error removing from client-side cache', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      identifier,
      storeName,
      mode,
    });
    throw error;
  }
}

/**
 * Initializes the client-side cache module with the provided configuration.
 */
export function initializeClientModule(
  cookieConfig: CookieCacheConfig,
  sessionConfig: SessionCacheConfig,
  globalConfig: GlobalConfig,
): void {
  initializeLogger(globalConfig);
  logger.info('Client-side cache module initialized', {
    cookieConfig: { ...cookieConfig, encryptionPassword: '[REDACTED]' },
    sessionConfig: { ...sessionConfig, encryptionPassword: '[REDACTED]' },
    globalConfig: { ...globalConfig, encryptionPassword: '[REDACTED]' },
  });
  initializeCaches(cookieConfig, sessionConfig, globalConfig);
}

/**
 * Clears all client-side caches.
 */
export function clientClearAll(
  config: CookieCacheConfig | SessionCacheConfig,
  globalConfig: GlobalConfig,
): void {
  const startTime = performance.now();
  logger.info('Clearing all client-side caches');
  initializeCaches(config as CookieCacheConfig, config as SessionCacheConfig, globalConfig);
  try {
    cookieCache!.clear();
    sessionStorageCache!.clear();
    logger.info('All client-side caches cleared');
    const duration = performance.now() - startTime;
    logger.debug('Client-side cache clear all operation completed', {
      duration: `${duration.toFixed(2)}ms`,
    });
  } catch (error) {
    logger.error('Error clearing all client-side caches', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

// Add an unhandled rejection handler for browser environments
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    logger.error('Unhandled Rejection at:', {
      reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
    });
  });
}

export { logger as clientLogger };
