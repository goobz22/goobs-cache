'use client';

import { GlobalConfig } from '../types';
import { ClientLogger } from './logger.client';

function measureExecutionTime<T>(func: () => T): { result: T; duration: number } {
  const start = performance.now();
  const result = func();
  const end = performance.now();
  return { result, duration: end - start };
}

export const ClientLastDateModule = (function () {
  function getLastUpdatedDateKey(identifier: string, storeName: string): string {
    const key = `${identifier}:${storeName}:lastUpdated`;
    ClientLogger.debug('Generated lastUpdated key', { key, identifier, storeName });
    return key;
  }

  function getLastAccessedDateKey(identifier: string, storeName: string): string {
    const key = `${identifier}:${storeName}:lastAccessed`;
    ClientLogger.debug('Generated lastAccessed key', { key, identifier, storeName });
    return key;
  }

  function parseDate(dateString: string | null): Date {
    const date = dateString ? new Date(dateString) : new Date(0);
    ClientLogger.debug('Parsed date', { date: date.toISOString(), dateString });
    return date;
  }

  return {
    initializeLogger(globalConfig: GlobalConfig): void {
      ClientLogger.initializeLogger(globalConfig);
      ClientLogger.info('Date service client initialized');
    },

    getLastUpdatedDate(
      get: (key: string) => string | null,
      identifier: string,
      storeName: string,
    ): Date {
      const { result, duration } = measureExecutionTime(() => {
        try {
          ClientLogger.info('Fetching last updated date', { identifier, storeName });
          const lastUpdatedKey = getLastUpdatedDateKey(identifier, storeName);
          const result = parseDate(get(lastUpdatedKey));
          ClientLogger.info('Retrieved last updated date', {
            identifier,
            storeName,
            date: result.toISOString(),
          });
          return result;
        } catch (error: unknown) {
          ClientLogger.error('Error in getLastUpdatedDate', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            identifier,
            storeName,
          });
          throw error;
        }
      });
      ClientLogger.info('getLastUpdatedDate execution time', { duration });
      return result;
    },

    getLastAccessedDate(
      get: (key: string) => string | null,
      identifier: string,
      storeName: string,
    ): Date {
      const { result, duration } = measureExecutionTime(() => {
        try {
          ClientLogger.info('Fetching last accessed date', { identifier, storeName });
          const lastAccessedKey = getLastAccessedDateKey(identifier, storeName);
          const result = parseDate(get(lastAccessedKey));
          ClientLogger.info('Retrieved last accessed date', {
            identifier,
            storeName,
            date: result.toISOString(),
          });
          return result;
        } catch (error: unknown) {
          ClientLogger.error('Error in getLastAccessedDate', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            identifier,
            storeName,
          });
          throw error;
        }
      });
      ClientLogger.info('getLastAccessedDate execution time', { duration });
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
          ClientLogger.info('Updating last updated date', {
            identifier,
            storeName,
            date: date.toISOString(),
          });
          const lastUpdatedKey = getLastUpdatedDateKey(identifier, storeName);
          set(lastUpdatedKey, date.toISOString());
          ClientLogger.info('Last updated date set successfully', {
            identifier,
            storeName,
            date: date.toISOString(),
          });
        } catch (error: unknown) {
          ClientLogger.error('Error in updateLastUpdatedDate', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            identifier,
            storeName,
            date: date.toISOString(),
          });
          throw error;
        }
      });
      ClientLogger.info('updateLastUpdatedDate execution time', { duration });
    },

    updateLastAccessedDate(
      set: (key: string, value: string) => void,
      identifier: string,
      storeName: string,
      date: Date = new Date(),
    ): void {
      const { duration } = measureExecutionTime(() => {
        try {
          ClientLogger.info('Updating last accessed date', {
            identifier,
            storeName,
            date: date.toISOString(),
          });
          const lastAccessedKey = getLastAccessedDateKey(identifier, storeName);
          set(lastAccessedKey, date.toISOString());
          ClientLogger.info('Last accessed date set successfully', {
            identifier,
            storeName,
            date: date.toISOString(),
          });
        } catch (error: unknown) {
          ClientLogger.error('Error in updateLastAccessedDate', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            identifier,
            storeName,
            date: date.toISOString(),
          });
          throw error;
        }
      });
      ClientLogger.info('updateLastAccessedDate execution time', { duration });
    },

    getLastDates(
      get: (key: string) => string | null,
      identifier: string,
      storeName: string,
    ): { lastUpdatedDate: Date; lastAccessedDate: Date } {
      const { result, duration } = measureExecutionTime(() => {
        try {
          ClientLogger.info('Fetching last dates', { identifier, storeName });
          const lastUpdatedDate = this.getLastUpdatedDate(get, identifier, storeName);
          const lastAccessedDate = this.getLastAccessedDate(get, identifier, storeName);
          const result = { lastUpdatedDate, lastAccessedDate };
          ClientLogger.info('Retrieved last dates', {
            identifier,
            storeName,
            lastUpdatedDate: lastUpdatedDate.toISOString(),
            lastAccessedDate: lastAccessedDate.toISOString(),
          });
          return result;
        } catch (error: unknown) {
          ClientLogger.error('Error in getLastDates', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            identifier,
            storeName,
          });
          throw error;
        }
      });
      ClientLogger.info('getLastDates execution time', { duration });
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
          ClientLogger.info('Updating last dates', {
            identifier,
            storeName,
            lastUpdatedDate: lastUpdatedDate?.toISOString(),
            lastAccessedDate: lastAccessedDate?.toISOString(),
          });

          if (lastUpdatedDate) {
            this.updateLastUpdatedDate(set, identifier, storeName, lastUpdatedDate);
          }
          this.updateLastAccessedDate(set, identifier, storeName, lastAccessedDate || new Date());

          ClientLogger.info('Last dates updated successfully', {
            identifier,
            storeName,
            lastUpdatedDate: lastUpdatedDate?.toISOString(),
            lastAccessedDate: (lastAccessedDate || new Date()).toISOString(),
          });
        } catch (error: unknown) {
          ClientLogger.error('Error in updateLastDates', {
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
      ClientLogger.info('updateLastDates execution time', { duration });
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
    ClientLogger.error('Unhandled Rejection at:', {
      reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
    });
  });
}

export default ClientLastDateModule;
