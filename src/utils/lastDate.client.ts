'use client';

export const ClientLastDateModule = (function () {
  function getLastUpdatedDateKey(identifier: string, storeName: string): string {
    return `${identifier}:${storeName}:lastUpdated`;
  }

  function getLastAccessedDateKey(identifier: string, storeName: string): string {
    return `${identifier}:${storeName}:lastAccessed`;
  }

  function parseDate(dateString: string | null): Date {
    return dateString ? new Date(dateString) : new Date(0);
  }

  return {
    getLastUpdatedDate(
      get: (key: string) => string | null,
      identifier: string,
      storeName: string,
    ): Date {
      const lastUpdatedKey = getLastUpdatedDateKey(identifier, storeName);
      return parseDate(get(lastUpdatedKey));
    },

    getLastAccessedDate(
      get: (key: string) => string | null,
      identifier: string,
      storeName: string,
    ): Date {
      const lastAccessedKey = getLastAccessedDateKey(identifier, storeName);
      return parseDate(get(lastAccessedKey));
    },

    updateLastUpdatedDate(
      set: (key: string, value: string) => void,
      identifier: string,
      storeName: string,
      date: Date = new Date(),
    ): void {
      const lastUpdatedKey = getLastUpdatedDateKey(identifier, storeName);
      set(lastUpdatedKey, date.toISOString());
    },

    updateLastAccessedDate(
      set: (key: string, value: string) => void,
      identifier: string,
      storeName: string,
      date: Date = new Date(),
    ): void {
      const lastAccessedKey = getLastAccessedDateKey(identifier, storeName);
      set(lastAccessedKey, date.toISOString());
    },

    getLastDates(
      get: (key: string) => string | null,
      identifier: string,
      storeName: string,
    ): { lastUpdatedDate: Date; lastAccessedDate: Date } {
      const lastUpdatedDate = this.getLastUpdatedDate(get, identifier, storeName);
      const lastAccessedDate = this.getLastAccessedDate(get, identifier, storeName);
      return { lastUpdatedDate, lastAccessedDate };
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
      if (lastUpdatedDate) {
        this.updateLastUpdatedDate(set, identifier, storeName, lastUpdatedDate);
      }
      this.updateLastAccessedDate(set, identifier, storeName, lastAccessedDate || new Date());
    },

    // Expose utility functions for potential external use
    getLastUpdatedDateKey,
    getLastAccessedDateKey,
    parseDate,
  };
})();

export default ClientLastDateModule;
