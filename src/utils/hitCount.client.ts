'use client';

import { createLogger, format, transports, Logger } from 'winston';
import { GlobalConfig } from '../types';

export const HitCountModule = (function () {
  let logger: Logger;

  function getCacheGetHitCountKey(identifier: string, storeName: string): string {
    const key = `${identifier}:${storeName}:getHitCount`;
    logger.debug('Generated getHitCount key', { key, identifier, storeName });
    return key;
  }

  function getCacheSetHitCountKey(identifier: string, storeName: string): string {
    const key = `${identifier}:${storeName}:setHitCount`;
    logger.debug('Generated setHitCount key', { key, identifier, storeName });
    return key;
  }

  function parseCacheHitCount(hitCountString: string | null): number {
    const hitCount = hitCountString ? parseInt(hitCountString, 10) : 0;
    logger.debug('Parsed hit count', { hitCount, hitCountString });
    return hitCount;
  }

  function incrementCacheHitCount(currentHitCount: number): number {
    const newHitCount = currentHitCount + 1;
    logger.debug('Incremented hit count', { currentHitCount, newHitCount });
    return newHitCount;
  }

  return {
    initializeLogger(globalConfig: GlobalConfig): void {
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
        defaultMeta: { service: 'cache-hit-service-client' },
        transports: [
          new transports.Console({
            format: format.combine(
              format.colorize(),
              format.printf(({ level, message, timestamp, metadata }) => {
                return `${timestamp} [${level}]: ${message} ${Object.keys(metadata).length ? JSON.stringify(metadata) : ''}`;
              }),
            ),
          }),
        ],
      });

      logger.info('Cache hit count service client initialized');
    },

    getLogger(): Logger {
      return logger;
    },

    getHitCounts(
      get: (key: string) => string | null,
      identifier: string,
      storeName: string,
    ): { getHitCount: number; setHitCount: number } {
      const startTime = performance.now();
      logger.info('Fetching hit counts', { identifier, storeName });

      const getHitCountKey = getCacheGetHitCountKey(identifier, storeName);
      const setHitCountKey = getCacheSetHitCountKey(identifier, storeName);

      const getHitCount = parseCacheHitCount(get(getHitCountKey));
      const setHitCount = parseCacheHitCount(get(setHitCountKey));

      const endTime = performance.now();
      const duration = endTime - startTime;

      logger.info('Retrieved hit counts', {
        identifier,
        storeName,
        getHitCount,
        setHitCount,
        duration: `${duration.toFixed(2)}ms`,
      });

      return { getHitCount, setHitCount };
    },

    incrementGetHitCount(
      get: (key: string) => string | null,
      set: (key: string, value: string) => void,
      identifier: string,
      storeName: string,
    ): number {
      const startTime = performance.now();
      logger.info('Incrementing get hit count', { identifier, storeName });

      const hitCountKey = getCacheGetHitCountKey(identifier, storeName);
      const currentHitCount = parseCacheHitCount(get(hitCountKey));
      const newHitCount = incrementCacheHitCount(currentHitCount);

      set(hitCountKey, newHitCount.toString());

      const endTime = performance.now();
      const duration = endTime - startTime;

      logger.info('Incremented get hit count', {
        identifier,
        storeName,
        oldHitCount: currentHitCount,
        newHitCount,
        duration: `${duration.toFixed(2)}ms`,
      });

      return newHitCount;
    },

    incrementSetHitCount(
      get: (key: string) => string | null,
      set: (key: string, value: string) => void,
      identifier: string,
      storeName: string,
    ): number {
      const startTime = performance.now();
      logger.info('Incrementing set hit count', { identifier, storeName });

      const hitCountKey = getCacheSetHitCountKey(identifier, storeName);
      const currentHitCount = parseCacheHitCount(get(hitCountKey));
      const newHitCount = incrementCacheHitCount(currentHitCount);

      set(hitCountKey, newHitCount.toString());

      const endTime = performance.now();
      const duration = endTime - startTime;

      logger.info('Incremented set hit count', {
        identifier,
        storeName,
        oldHitCount: currentHitCount,
        newHitCount,
        duration: `${duration.toFixed(2)}ms`,
      });

      return newHitCount;
    },

    setHitCounts(
      set: (key: string, value: string) => void,
      identifier: string,
      storeName: string,
      getHitCount: number,
      setHitCount: number,
    ): void {
      const startTime = performance.now();
      logger.info('Setting hit counts', { identifier, storeName, getHitCount, setHitCount });

      const getHitCountKey = getCacheGetHitCountKey(identifier, storeName);
      const setHitCountKey = getCacheSetHitCountKey(identifier, storeName);

      set(getHitCountKey, getHitCount.toString());
      set(setHitCountKey, setHitCount.toString());

      const endTime = performance.now();
      const duration = endTime - startTime;

      logger.info('Hit counts set successfully', {
        identifier,
        storeName,
        getHitCount,
        setHitCount,
        duration: `${duration.toFixed(2)}ms`,
      });
    },

    // Expose utility functions for potential external use
    getCacheGetHitCountKey,
    getCacheSetHitCountKey,
    parseCacheHitCount,
    incrementCacheHitCount,
  };
})();

// Add an unhandled rejection handler for browser environments
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const logger = HitCountModule.getLogger();
    if (logger) {
      logger.error('Unhandled Rejection at:', {
        reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
        stack: event.reason instanceof Error ? event.reason.stack : undefined,
      });
    }
  });
}

export default HitCountModule;
