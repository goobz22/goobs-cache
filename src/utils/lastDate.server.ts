import { GlobalConfig } from '../types';
import { ServerLogger } from 'goobs-testing';

async function measureAsyncExecutionTime<T>(
  func: () => Promise<T>,
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await func();
  const end = performance.now();
  return { result, duration: end - start };
}

export const ServerLastDateModule = (function () {
  async function getLastUpdatedDateKey(identifier: string, storeName: string): Promise<string> {
    const key = `${identifier}:${storeName}:lastUpdated`;
    await ServerLogger.debug('Generated lastUpdated key', { key, identifier, storeName });
    return key;
  }

  async function getLastAccessedDateKey(identifier: string, storeName: string): Promise<string> {
    const key = `${identifier}:${storeName}:lastAccessed`;
    await ServerLogger.debug('Generated lastAccessed key', { key, identifier, storeName });
    return key;
  }

  async function parseDate(dateString: string | null): Promise<Date> {
    const date = dateString ? new Date(dateString) : new Date(0);
    await ServerLogger.debug('Parsed date', { date: date.toISOString(), dateString });
    return date;
  }

  return {
    async initializeLogger(globalConfig: GlobalConfig): Promise<void> {
      await ServerLogger.initializeLogger(globalConfig);
      await ServerLogger.info('Date service initialized');
    },

    async getLastUpdatedDate(
      get: (key: string) => Promise<string | null>,
      identifier: string,
      storeName: string,
    ): Promise<Date> {
      const { result, duration } = await measureAsyncExecutionTime(async () => {
        try {
          await ServerLogger.info('Fetching last updated date', { identifier, storeName });
          const lastUpdatedKey = await getLastUpdatedDateKey(identifier, storeName);
          const result = await parseDate(await get(lastUpdatedKey));
          await ServerLogger.info('Retrieved last updated date', {
            identifier,
            storeName,
            date: result.toISOString(),
          });
          return result;
        } catch (error: unknown) {
          await ServerLogger.error('Error in getLastUpdatedDate', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            identifier,
            storeName,
          });
          throw error;
        }
      });
      await ServerLogger.info('getLastUpdatedDate execution time', { duration });
      return result;
    },

    async getLastAccessedDate(
      get: (key: string) => Promise<string | null>,
      identifier: string,
      storeName: string,
    ): Promise<Date> {
      const { result, duration } = await measureAsyncExecutionTime(async () => {
        try {
          await ServerLogger.info('Fetching last accessed date', { identifier, storeName });
          const lastAccessedKey = await getLastAccessedDateKey(identifier, storeName);
          const result = await parseDate(await get(lastAccessedKey));
          await ServerLogger.info('Retrieved last accessed date', {
            identifier,
            storeName,
            date: result.toISOString(),
          });
          return result;
        } catch (error: unknown) {
          await ServerLogger.error('Error in getLastAccessedDate', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            identifier,
            storeName,
          });
          throw error;
        }
      });
      await ServerLogger.info('getLastAccessedDate execution time', { duration });
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
          await ServerLogger.info('Updating last updated date', {
            identifier,
            storeName,
            date: date.toISOString(),
          });
          const lastUpdatedKey = await getLastUpdatedDateKey(identifier, storeName);
          await set(lastUpdatedKey, date.toISOString());
          await ServerLogger.info('Last updated date set successfully', {
            identifier,
            storeName,
            date: date.toISOString(),
          });
        } catch (error: unknown) {
          await ServerLogger.error('Error in updateLastUpdatedDate', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            identifier,
            storeName,
            date: date.toISOString(),
          });
          throw error;
        }
      });
      await ServerLogger.info('updateLastUpdatedDate execution time', { duration });
    },

    async updateLastAccessedDate(
      set: (key: string, value: string) => Promise<void>,
      identifier: string,
      storeName: string,
      date: Date = new Date(),
    ): Promise<void> {
      const { duration } = await measureAsyncExecutionTime(async () => {
        try {
          await ServerLogger.info('Updating last accessed date', {
            identifier,
            storeName,
            date: date.toISOString(),
          });
          const lastAccessedKey = await getLastAccessedDateKey(identifier, storeName);
          await set(lastAccessedKey, date.toISOString());
          await ServerLogger.info('Last accessed date set successfully', {
            identifier,
            storeName,
            date: date.toISOString(),
          });
        } catch (error: unknown) {
          await ServerLogger.error('Error in updateLastAccessedDate', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            identifier,
            storeName,
            date: date.toISOString(),
          });
          throw error;
        }
      });
      await ServerLogger.info('updateLastAccessedDate execution time', { duration });
    },

    async getLastDates(
      get: (key: string) => Promise<string | null>,
      identifier: string,
      storeName: string,
    ): Promise<{ lastUpdatedDate: Date; lastAccessedDate: Date }> {
      const { result, duration } = await measureAsyncExecutionTime(async () => {
        try {
          await ServerLogger.info('Fetching last dates', { identifier, storeName });
          const [lastUpdatedDate, lastAccessedDate] = await Promise.all([
            this.getLastUpdatedDate(get, identifier, storeName),
            this.getLastAccessedDate(get, identifier, storeName),
          ]);
          const result = { lastUpdatedDate, lastAccessedDate };
          await ServerLogger.info('Retrieved last dates', {
            identifier,
            storeName,
            lastUpdatedDate: lastUpdatedDate.toISOString(),
            lastAccessedDate: lastAccessedDate.toISOString(),
          });
          return result;
        } catch (error: unknown) {
          await ServerLogger.error('Error in getLastDates', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            identifier,
            storeName,
          });
          throw error;
        }
      });
      await ServerLogger.info('getLastDates execution time', { duration });
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
          await ServerLogger.info('Updating last dates', {
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

          await ServerLogger.info('Last dates updated successfully', {
            identifier,
            storeName,
            lastUpdatedDate: lastUpdatedDate?.toISOString(),
            lastAccessedDate: (lastAccessedDate || new Date()).toISOString(),
          });
        } catch (error: unknown) {
          await ServerLogger.error('Error in updateLastDates', {
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
      await ServerLogger.info('updateLastDates execution time', { duration });
    },

    // Expose utility functions for potential external use
    getLastUpdatedDateKey,
    getLastAccessedDateKey,
    parseDate,
  };
})();

// Add an unhandled rejection handler
process.on('unhandledRejection', async (reason: unknown, promise: Promise<unknown>) => {
  await ServerLogger.error('Unhandled Rejection at:', {
    promise,
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

export default ServerLastDateModule;
