// Private utility functions
function getLastUpdatedDateKey(identifier: string, storeName: string): string {
  return `${identifier}:${storeName}:lastUpdated`;
}

function getLastAccessedDateKey(identifier: string, storeName: string): string {
  return `${identifier}:${storeName}:lastAccessed`;
}

function parseDate(dateString: string | null): Date {
  return dateString ? new Date(dateString) : new Date(0);
}

// Exported functions
export function getLastUpdatedDate(
  get: (key: string) => string | null,
  identifier: string,
  storeName: string,
): Date {
  const lastUpdatedKey = getLastUpdatedDateKey(identifier, storeName);
  return parseDate(get(lastUpdatedKey));
}

export function getLastAccessedDate(
  get: (key: string) => string | null,
  identifier: string,
  storeName: string,
): Date {
  const lastAccessedKey = getLastAccessedDateKey(identifier, storeName);
  return parseDate(get(lastAccessedKey));
}

export function updateLastUpdatedDate(
  set: (key: string, value: string) => void,
  identifier: string,
  storeName: string,
  date: Date = new Date(),
): void {
  const lastUpdatedKey = getLastUpdatedDateKey(identifier, storeName);
  set(lastUpdatedKey, date.toISOString());
}

export function updateLastAccessedDate(
  set: (key: string, value: string) => void,
  identifier: string,
  storeName: string,
  date: Date = new Date(),
): void {
  const lastAccessedKey = getLastAccessedDateKey(identifier, storeName);
  set(lastAccessedKey, date.toISOString());
}

// Convenience function to get both dates
export function getLastDates(
  get: (key: string) => string | null,
  identifier: string,
  storeName: string,
): { lastUpdatedDate: Date; lastAccessedDate: Date } {
  return {
    lastUpdatedDate: getLastUpdatedDate(get, identifier, storeName),
    lastAccessedDate: getLastAccessedDate(get, identifier, storeName),
  };
}

// Convenience function to update both dates
export function updateLastDates(
  set: (key: string, value: string) => void,
  identifier: string,
  storeName: string,
  { lastUpdatedDate, lastAccessedDate }: { lastUpdatedDate?: Date; lastAccessedDate?: Date } = {},
): void {
  if (lastUpdatedDate) {
    updateLastUpdatedDate(set, identifier, storeName, lastUpdatedDate);
  }
  updateLastAccessedDate(set, identifier, storeName, lastAccessedDate);
}
