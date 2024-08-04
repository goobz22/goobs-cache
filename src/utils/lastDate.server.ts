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

export const ServerLastDateModule = (function () {
  let logger: Logger;

  async function getLastUpdatedDateKey(identifier: string, storeName: string): Promise<string> {
    const key = `${identifier}:${storeName}:lastUpdated`;
    logger.debug('Generated lastUpdated key', { key, identifier, storeName });
    return key;
  }

  async function getLastAccessedDateKey(identifier: string, storeName: string): Promise<string> {
    const key = `${identifier}:${storeName}:lastAccessed`;
    logger.debug('Generated lastAccessed key', { key, identifier, storeName });
    return key;
  }

  async function parseDate(dateString: string | null): Promise<Date> {
    const date = dateString ? new Date(dateString) : new Date(0);
    logger.debug('Parsed date', { date: date.toISOString(), dateString });
    return date;
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
        defaultMeta: { service: 'date-service' },
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
            filename: path.join(globalConfig.logDirectory, 'date-service-error.log'),
            level: 'error',
          }),
          new transports.File({
            filename: path.join(globalConfig.logDirectory, 'date-service-combined.log'),
          }),
        ],
      });

      logger.info('Date service initialized');
    },

    getLogger(): Logger {
      return logger;
    },

    async getLastUpdatedDate(
      get: (key: string) => Promise<string | null>,
      identifier: string,
      storeName: string,
    ): Promise<Date> {
      const { result, duration } = await measureAsyncExecutionTime(async () => {
        try {
          logger.info('Fetching last updated date', { identifier, storeName });
          const lastUpdatedKey = await getLastUpdatedDateKey(identifier, storeName);
          const result = await parseDate(await get(lastUpdatedKey));
          logger.info('Retrieved last updated date', {
            identifier,
            storeName,
            date: result.toISOString(),
          });
          return result;
        } catch (error: unknown) {
          logger.error('Error in getLastUpdatedDate', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            identifier,
            storeName,
          });
          throw error;
        }
      });
      logger.info('getLastUpdatedDate execution time', { duration });
      return result;
    },

    async getLastAccessedDate(
      get: (key: string) => Promise<string | null>,
      identifier: string,
      storeName: string,
    ): Promise<Date> {
      const { result, duration } = await measureAsyncExecutionTime(async () => {
        try {
          logger.info('Fetching last accessed date', { identifier, storeName });
          const lastAccessedKey = await getLastAccessedDateKey(identifier, storeName);
          const result = await parseDate(await get(lastAccessedKey));
          logger.info('Retrieved last accessed date', {
            identifier,
            storeName,
            date: result.toISOString(),
          });
          return result;
        } catch (error: unknown) {
          logger.error('Error in getLastAccessedDate', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            identifier,
            storeName,
          });
          throw error;
        }
      });
      logger.info('getLastAccessedDate execution time', { duration });
      return result;
    },

    async updateLastUpdatedDate(
      set: (key: string, value: string) => Promise<void>,
      identifier: string,
      storeName: string,
      date: Date = new Date(),
    ): Promise<void> {
      const { duration } = await measureAsyncExecutionTime(async () => {
        try {
          logger.info('Updating last updated date', {
            identifier,
            storeName,
            date: date.toISOString(),
          });
          const lastUpdatedKey = await getLastUpdatedDateKey(identifier, storeName);
          await set(lastUpdatedKey, date.toISOString());
          logger.info('Last updated date set successfully', {
            identifier,
            storeName,
            date: date.toISOString(),
          });
        } catch (error: unknown) {
          logger.error('Error in updateLastUpdatedDate', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            identifier,
            storeName,
            date: date.toISOString(),
          });
          throw error;
        }
      });
      logger.info('updateLastUpdatedDate execution time', { duration });
    },

    async updateLastAccessedDate(
      set: (key: string, value: string) => Promise<void>,
      identifier: string,
      storeName: string,
      date: Date = new Date(),
    ): Promise<void> {
      const { duration } = await measureAsyncExecutionTime(async () => {
        try {
          logger.info('Updating last accessed date', {
            identifier,
            storeName,
            date: date.toISOString(),
          });
          const lastAccessedKey = await getLastAccessedDateKey(identifier, storeName);
          await set(lastAccessedKey, date.toISOString());
          logger.info('Last accessed date set successfully', {
            identifier,
            storeName,
            date: date.toISOString(),
          });
        } catch (error: unknown) {
          logger.error('Error in updateLastAccessedDate', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            identifier,
            storeName,
            date: date.toISOString(),
          });
          throw error;
        }
      });
      logger.info('updateLastAccessedDate execution time', { duration });
    },

    async getLastDates(
      get: (key: string) => Promise<string | null>,
      identifier: string,
      storeName: string,
    ): Promise<{ lastUpdatedDate: Date; lastAccessedDate: Date }> {
      const { result, duration } = await measureAsyncExecutionTime(async () => {
        try {
          logger.info('Fetching last dates', { identifier, storeName });
          const [lastUpdatedDate, lastAccessedDate] = await Promise.all([
            this.getLastUpdatedDate(get, identifier, storeName),
            this.getLastAccessedDate(get, identifier, storeName),
          ]);
          const result = { lastUpdatedDate, lastAccessedDate };
          logger.info('Retrieved last dates', {
            identifier,
            storeName,
            lastUpdatedDate: lastUpdatedDate.toISOString(),
            lastAccessedDate: lastAccessedDate.toISOString(),
          });
          return result;
        } catch (error: unknown) {
          logger.error('Error in getLastDates', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            identifier,
            storeName,
          });
          throw error;
        }
      });
      logger.info('getLastDates execution time', { duration });
      return result;
    },

    async updateLastDates(
      set: (key: string, value: string) => Promise<void>,
      identifier: string,
      storeName: string,
      {
        lastUpdatedDate,
        lastAccessedDate,
      }: { lastUpdatedDate?: Date; lastAccessedDate?: Date } = {},
    ): Promise<void> {
      const { duration } = await measureAsyncExecutionTime(async () => {
        try {
          logger.info('Updating last dates', {
            identifier,
            storeName,
            lastUpdatedDate: lastUpdatedDate?.toISOString(),
            lastAccessedDate: lastAccessedDate?.toISOString(),
          });

          const updatePromises: Promise<void>[] = [];

          if (lastUpdatedDate) {
            updatePromises.push(
              this.updateLastUpdatedDate(set, identifier, storeName, lastUpdatedDate),
            );
          }
          updatePromises.push(
            this.updateLastAccessedDate(set, identifier, storeName, lastAccessedDate || new Date()),
          );

          await Promise.all(updatePromises);

          logger.info('Last dates updated successfully', {
            identifier,
            storeName,
            lastUpdatedDate: lastUpdatedDate?.toISOString(),
            lastAccessedDate: (lastAccessedDate || new Date()).toISOString(),
          });
        } catch (error: unknown) {
          logger.error('Error in updateLastDates', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            identifier,
            storeName,
            lastUpdatedDate: lastUpdatedDate?.toISOString(),
            lastAccessedDate: lastAccessedDate?.toISOString(),
          });
          throw error;
        }
      });
      logger.info('updateLastDates execution time', { duration });
    },

    // Expose utility functions for potential external use
    getLastUpdatedDateKey,
    getLastAccessedDateKey,
    parseDate,
  };
})();

// Add an unhandled rejection handler
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  ServerLastDateModule.getLogger().error('Unhandled Rejection at:', {
    promise,
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

export default ServerLastDateModule;
