'use client';

import { GlobalConfig } from '../types';
import { ClientLogger } from './logger.client';

export const HitCountModule = (function () {
  function getCacheGetHitCountKey(identifier: string, storeName: string): string {
    const key = `${identifier}:${storeName}:getHitCount`;
    ClientLogger.debug('Generated getHitCount key', { key, identifier, storeName });
    return key;
  }

  function getCacheSetHitCountKey(identifier: string, storeName: string): string {
    const key = `${identifier}:${storeName}:setHitCount`;
    ClientLogger.debug('Generated setHitCount key', { key, identifier, storeName });
    return key;
  }

  function parseCacheHitCount(hitCountString: string | null): number {
    const hitCount = hitCountString ? parseInt(hitCountString, 10) : 0;
    ClientLogger.debug('Parsed hit count', { hitCount, hitCountString });
    return hitCount;
  }

  function incrementCacheHitCount(currentHitCount: number): number {
    const newHitCount = currentHitCount + 1;
    ClientLogger.debug('Incremented hit count', { currentHitCount, newHitCount });
    return newHitCount;
  }

  return {
    initializeLogger(globalConfig: GlobalConfig): void {
      ClientLogger.initializeLogger(globalConfig);
      ClientLogger.info('Cache hit count service client initialized');
    },

    getHitCounts(
      get: (key: string) => string | null,
      identifier: string,
      storeName: string,
    ): { getHitCount: number; setHitCount: number } {
      const startTime = performance.now();
      ClientLogger.info('Fetching hit counts', { identifier, storeName });

      const getHitCountKey = getCacheGetHitCountKey(identifier, storeName);
      const setHitCountKey = getCacheSetHitCountKey(identifier, storeName);

      const getHitCount = parseCacheHitCount(get(getHitCountKey));
      const setHitCount = parseCacheHitCount(get(setHitCountKey));

      const endTime = performance.now();
      const duration = endTime - startTime;

      ClientLogger.info('Retrieved hit counts', {
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
      ClientLogger.info('Incrementing get hit count', { identifier, storeName });

      const hitCountKey = getCacheGetHitCountKey(identifier, storeName);
      const currentHitCount = parseCacheHitCount(get(hitCountKey));
      const newHitCount = incrementCacheHitCount(currentHitCount);

      set(hitCountKey, newHitCount.toString());

      const endTime = performance.now();
      const duration = endTime - startTime;

      ClientLogger.info('Incremented get hit count', {
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
      ClientLogger.info('Incrementing set hit count', { identifier, storeName });

      const hitCountKey = getCacheSetHitCountKey(identifier, storeName);
      const currentHitCount = parseCacheHitCount(get(hitCountKey));
      const newHitCount = incrementCacheHitCount(currentHitCount);

      set(hitCountKey, newHitCount.toString());

      const endTime = performance.now();
      const duration = endTime - startTime;

      ClientLogger.info('Incremented set hit count', {
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
      ClientLogger.info('Setting hit counts', { identifier, storeName, getHitCount, setHitCount });

      const getHitCountKey = getCacheGetHitCountKey(identifier, storeName);
      const setHitCountKey = getCacheSetHitCountKey(identifier, storeName);

      set(getHitCountKey, getHitCount.toString());
      set(setHitCountKey, setHitCount.toString());

      const endTime = performance.now();
      const duration = endTime - startTime;

      ClientLogger.info('Hit counts set successfully', {
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
    ClientLogger.error('Unhandled Rejection at:', {
      reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
    });
  });
}

export default HitCountModule;
