// Private utility functions
async function getLastUpdatedDateKey(identifier: string, storeName: string): Promise<string> {
  return `${identifier}:${storeName}:lastUpdated`;
}

async function getLastAccessedDateKey(identifier: string, storeName: string): Promise<string> {
  return `${identifier}:${storeName}:lastAccessed`;
}

async function parseDate(dateString: string | null): Promise<Date> {
  return dateString ? new Date(dateString) : new Date(0);
}

// Exported functions
export async function getLastUpdatedDate(
  get: (key: string) => Promise<string | null>,
  identifier: string,
  storeName: string,
): Promise<Date> {
  const lastUpdatedKey = await getLastUpdatedDateKey(identifier, storeName);
  return parseDate(await get(lastUpdatedKey));
}

export async function getLastAccessedDate(
  get: (key: string) => Promise<string | null>,
  identifier: string,
  storeName: string,
): Promise<Date> {
  const lastAccessedKey = await getLastAccessedDateKey(identifier, storeName);
  return parseDate(await get(lastAccessedKey));
}

export async function updateLastUpdatedDate(
  set: (key: string, value: string) => Promise<void>,
  identifier: string,
  storeName: string,
  date: Date = new Date(),
): Promise<void> {
  const lastUpdatedKey = await getLastUpdatedDateKey(identifier, storeName);
  await set(lastUpdatedKey, date.toISOString());
}

export async function updateLastAccessedDate(
  set: (key: string, value: string) => Promise<void>,
  identifier: string,
  storeName: string,
  date: Date = new Date(),
): Promise<void> {
  const lastAccessedKey = await getLastAccessedDateKey(identifier, storeName);
  await set(lastAccessedKey, date.toISOString());
}

// Convenience function to get both dates
export async function getLastDates(
  get: (key: string) => Promise<string | null>,
  identifier: string,
  storeName: string,
): Promise<{ lastUpdatedDate: Date; lastAccessedDate: Date }> {
  return {
    lastUpdatedDate: await getLastUpdatedDate(get, identifier, storeName),
    lastAccessedDate: await getLastAccessedDate(get, identifier, storeName),
  };
}

// Convenience function to update both dates
export async function updateLastDates(
  set: (key: string, value: string) => Promise<void>,
  identifier: string,
  storeName: string,
  { lastUpdatedDate, lastAccessedDate }: { lastUpdatedDate?: Date; lastAccessedDate?: Date } = {},
): Promise<void> {
  if (lastUpdatedDate) {
    await updateLastUpdatedDate(set, identifier, storeName, lastUpdatedDate);
  }
  await updateLastAccessedDate(set, identifier, storeName, lastAccessedDate);
}
