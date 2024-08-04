'use client';

import { createLogger, format, transports, Logger } from 'winston';
import { GlobalConfig } from '../types';

function measureExecutionTime<T>(func: () => T): { result: T; duration: number } {
  const start = performance.now();
  const result = func();
  const end = performance.now();
  return { result, duration: end - start };
}

export const ClientLastDateModule = (function () {
  let logger: Logger;

  function getLastUpdatedDateKey(identifier: string, storeName: string): string {
    const key = `${identifier}:${storeName}:lastUpdated`;
    logger.debug('Generated lastUpdated key', { key, identifier, storeName });
    return key;
  }

  function getLastAccessedDateKey(identifier: string, storeName: string): string {
    const key = `${identifier}:${storeName}:lastAccessed`;
    logger.debug('Generated lastAccessed key', { key, identifier, storeName });
    return key;
  }

  function parseDate(dateString: string | null): Date {
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
        defaultMeta: { service: 'date-service-client' },
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

      logger.info('Date service client initialized');
    },

    getLogger(): Logger {
      return logger;
    },

    getLastUpdatedDate(
      get: (key: string) => string | null,
      identifier: string,
      storeName: string,
    ): Date {
      const { result, duration } = measureExecutionTime(() => {
        try {
          logger.info('Fetching last updated date', { identifier, storeName });
          const lastUpdatedKey = getLastUpdatedDateKey(identifier, storeName);
          const result = parseDate(get(lastUpdatedKey));
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

    getLastAccessedDate(
      get: (key: string) => string | null,
      identifier: string,
      storeName: string,
    ): Date {
      const { result, duration } = measureExecutionTime(() => {
        try {
          logger.info('Fetching last accessed date', { identifier, storeName });
          const lastAccessedKey = getLastAccessedDateKey(identifier, storeName);
          const result = parseDate(get(lastAccessedKey));
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

    updateLastUpdatedDate(
      set: (key: string, value: string) => void,
      identifier: string,
      storeName: string,
      date: Date = new Date(),
    ): void {
      const { duration } = measureExecutionTime(() => {
        try {
          logger.info('Updating last updated date', {
            identifier,
            storeName,
            date: date.toISOString(),
          });
          const lastUpdatedKey = getLastUpdatedDateKey(identifier, storeName);
          set(lastUpdatedKey, date.toISOString());
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

    updateLastAccessedDate(
      set: (key: string, value: string) => void,
      identifier: string,
      storeName: string,
      date: Date = new Date(),
    ): void {
      const { duration } = measureExecutionTime(() => {
        try {
          logger.info('Updating last accessed date', {
            identifier,
            storeName,
            date: date.toISOString(),
          });
          const lastAccessedKey = getLastAccessedDateKey(identifier, storeName);
          set(lastAccessedKey, date.toISOString());
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

    getLastDates(
      get: (key: string) => string | null,
      identifier: string,
      storeName: string,
    ): { lastUpdatedDate: Date; lastAccessedDate: Date } {
      const { result, duration } = measureExecutionTime(() => {
        try {
          logger.info('Fetching last dates', { identifier, storeName });
          const lastUpdatedDate = this.getLastUpdatedDate(get, identifier, storeName);
          const lastAccessedDate = this.getLastAccessedDate(get, identifier, storeName);
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

    updateLastDates(
      set: (key: string, value: string) => void,
      identifier: string,
      storeName: string,
      {
        lastUpdatedDate,
        lastAccessedDate,
      }: { lastUpdatedDate?: Date; lastAccessedDate?: Date } = {},
    ): void {
      const { duration } = measureExecutionTime(() => {
        try {
          logger.info('Updating last dates', {
            identifier,
            storeName,
            lastUpdatedDate: lastUpdatedDate?.toISOString(),
            lastAccessedDate: lastAccessedDate?.toISOString(),
          });

          if (lastUpdatedDate) {
            this.updateLastUpdatedDate(set, identifier, storeName, lastUpdatedDate);
          }
          this.updateLastAccessedDate(set, identifier, storeName, lastAccessedDate || new Date());

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

// Add an unhandled rejection handler for browser environments
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    ClientLastDateModule.getLogger().error('Unhandled Rejection at:', {
      reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
    });
  });
}

export default ClientLastDateModule;
