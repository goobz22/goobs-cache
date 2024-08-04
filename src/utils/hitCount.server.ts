import { createLogger, format, transports, Logger } from 'winston';
import { GlobalConfig } from '../types';
import path from 'path';

async function measureAsyncExecutionTime<T>(
  func: () => Promise<T>,
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await func();
  const end = performance.now();
  return { result, duration: end - start };
}

export const ServerHitCountModule = (function () {
  let logger: Logger;

  async function getCacheGetHitCountKey(identifier: string, storeName: string): Promise<string> {
    const key = `${identifier}:${storeName}:getHitCount`;
    logger.debug('Generated getHitCount key', { key, identifier, storeName });
    return key;
  }

  async function getCacheSetHitCountKey(identifier: string, storeName: string): Promise<string> {
    const key = `${identifier}:${storeName}:setHitCount`;
    logger.debug('Generated setHitCount key', { key, identifier, storeName });
    return key;
  }

  async function parseCacheHitCount(hitCountString: string | null): Promise<number> {
    const hitCount = hitCountString ? parseInt(hitCountString, 10) : 0;
    logger.debug('Parsed hit count', { hitCount, hitCountString });
    return hitCount;
  }

  async function incrementCacheHitCount(currentHitCount: number): Promise<number> {
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
        defaultMeta: { service: 'async-cache-hit-service' },
        transports: [
          new transports.Console({
            format: format.combine(
              format.colorize(),
              format.printf(({ level, message, timestamp, metadata }) => {
                return `${timestamp} [${level}]: ${message} ${Object.keys(metadata).length ? JSON.stringify(metadata) : ''}`;
              }),
            ),
          }),
          new transports.File({
            filename: path.join(globalConfig.logDirectory, 'async-cache-hit-error.log'),
            level: 'error',
          }),
          new transports.File({
            filename: path.join(globalConfig.logDirectory, 'async-cache-hit-combined.log'),
          }),
        ],
      });

      logger.info('Async cache hit count service initialized');
    },

    getLogger(): Logger {
      return logger;
    },

    async getHitCounts(
      get: (key: string) => Promise<string | null>,
      identifier: string,
      storeName: string,
    ): Promise<{ getHitCount: number; setHitCount: number }> {
      const { result, duration } = await measureAsyncExecutionTime(async () => {
        try {
          logger.info('Fetching hit counts', { identifier, storeName });
          const getHitCountKey = await getCacheGetHitCountKey(identifier, storeName);
          const setHitCountKey = await getCacheSetHitCountKey(identifier, storeName);

          const [getHitCount, setHitCount] = await Promise.all([
            parseCacheHitCount(await get(getHitCountKey)),
            parseCacheHitCount(await get(setHitCountKey)),
          ]);

          const result = { getHitCount, setHitCount };
          logger.info('Retrieved hit counts', {
            identifier,
            storeName,
            getHitCount,
            setHitCount,
          });
          return result;
        } catch (error) {
          logger.error('Error fetching hit counts', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            identifier,
            storeName,
          });
          throw error;
        }
      });
      logger.info('getHitCounts execution time', { duration });
      return result;
    },

    async incrementGetHitCount(
      get: (key: string) => Promise<string | null>,
      set: (key: string, value: string) => Promise<void>,
      identifier: string,
      storeName: string,
    ): Promise<number> {
      const { result: newHitCount, duration } = await measureAsyncExecutionTime(async () => {
        try {
          logger.info('Incrementing get hit count', { identifier, storeName });
          const hitCountKey = await getCacheGetHitCountKey(identifier, storeName);
          const currentHitCount = await parseCacheHitCount(await get(hitCountKey));
          const newHitCount = await incrementCacheHitCount(currentHitCount);

          await set(hitCountKey, newHitCount.toString());

          logger.info('Incremented get hit count', {
            identifier,
            storeName,
            oldHitCount: currentHitCount,
            newHitCount,
          });
          return newHitCount;
        } catch (error) {
          logger.error('Error incrementing get hit count', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            identifier,
            storeName,
          });
          throw error;
        }
      });
      logger.info('incrementGetHitCount execution time', { duration });
      return newHitCount;
    },

    async incrementSetHitCount(
      get: (key: string) => Promise<string | null>,
      set: (key: string, value: string) => Promise<void>,
      identifier: string,
      storeName: string,
    ): Promise<number> {
      const { result: newHitCount, duration } = await measureAsyncExecutionTime(async () => {
        try {
          logger.info('Incrementing set hit count', { identifier, storeName });
          const hitCountKey = await getCacheSetHitCountKey(identifier, storeName);
          const currentHitCount = await parseCacheHitCount(await get(hitCountKey));
          const newHitCount = await incrementCacheHitCount(currentHitCount);

          await set(hitCountKey, newHitCount.toString());

          logger.info('Incremented set hit count', {
            identifier,
            storeName,
            oldHitCount: currentHitCount,
            newHitCount,
          });
          return newHitCount;
        } catch (error) {
          logger.error('Error incrementing set hit count', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            identifier,
            storeName,
          });
          throw error;
        }
      });
      logger.info('incrementSetHitCount execution time', { duration });
      return newHitCount;
    },

    async setHitCounts(
      set: (key: string, value: string) => Promise<void>,
      identifier: string,
      storeName: string,
      getHitCount: number,
      setHitCount: number,
    ): Promise<void> {
      const { duration } = await measureAsyncExecutionTime(async () => {
        logger.info('Setting hit counts', { identifier, storeName, getHitCount, setHitCount });

        const [getHitCountKey, setHitCountKey] = await Promise.all([
          getCacheGetHitCountKey(identifier, storeName),
          getCacheSetHitCountKey(identifier, storeName),
        ]);

        await Promise.all([
          set(getHitCountKey, getHitCount.toString()),
          set(setHitCountKey, setHitCount.toString()),
        ]);

        logger.info('Hit counts set successfully', {
          identifier,
          storeName,
          getHitCount,
          setHitCount,
        });
      });

      logger.info('setHitCounts execution time', { duration: `${duration.toFixed(2)}ms` });
    },

    // Expose utility functions for potential external use
    getCacheGetHitCountKey,
    getCacheSetHitCountKey,
    parseCacheHitCount,
    incrementCacheHitCount,
  };
})();

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  ServerHitCountModule.getLogger().error('Unhandled Rejection at:', {
    promise,
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

export default ServerHitCountModule;
