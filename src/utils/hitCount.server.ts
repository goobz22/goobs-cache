// Private utility functions
async function getCacheGetHitCountKey(identifier: string, storeName: string): Promise<string> {
  return `${identifier}:${storeName}:getHitCount`;
}

async function getCacheSetHitCountKey(identifier: string, storeName: string): Promise<string> {
  return `${identifier}:${storeName}:setHitCount`;
}

async function parseCacheHitCount(hitCountString: string | null): Promise<number> {
  return hitCountString ? parseInt(hitCountString, 10) : 0;
}

async function incrementCacheHitCount(currentHitCount: number): Promise<number> {
  return currentHitCount + 1;
}

export async function getHitCounts(
  get: (key: string) => Promise<string | null>,
  identifier: string,
  storeName: string,
): Promise<{ getHitCount: number; setHitCount: number }> {
  const getHitCountKey = await getCacheGetHitCountKey(identifier, storeName);
  const setHitCountKey = await getCacheSetHitCountKey(identifier, storeName);

  return {
    getHitCount: await parseCacheHitCount(await get(getHitCountKey)),
    setHitCount: await parseCacheHitCount(await get(setHitCountKey)),
  };
}

export async function incrementGetHitCount(
  get: (key: string) => Promise<string | null>,
  set: (key: string, value: string) => Promise<void>,
  identifier: string,
  storeName: string,
): Promise<number> {
  const hitCountKey = await getCacheGetHitCountKey(identifier, storeName);
  const currentHitCount = await parseCacheHitCount(await get(hitCountKey));
  const newHitCount = await incrementCacheHitCount(currentHitCount);
  await set(hitCountKey, newHitCount.toString());
  return newHitCount;
}

export async function incrementSetHitCount(
  get: (key: string) => Promise<string | null>,
  set: (key: string, value: string) => Promise<void>,
  identifier: string,
  storeName: string,
): Promise<number> {
  const hitCountKey = await getCacheSetHitCountKey(identifier, storeName);
  const currentHitCount = await parseCacheHitCount(await get(hitCountKey));
  const newHitCount = await incrementCacheHitCount(currentHitCount);
  await set(hitCountKey, newHitCount.toString());
  return newHitCount;
}

export async function setHitCounts(
  set: (key: string, value: string) => Promise<void>,
  identifier: string,
  storeName: string,
  getHitCount: number,
  setHitCount: number,
): Promise<void> {
  const getHitCountKey = await getCacheGetHitCountKey(identifier, storeName);
  const setHitCountKey = await getCacheSetHitCountKey(identifier, storeName);

  await set(getHitCountKey, getHitCount.toString());
  await set(setHitCountKey, setHitCount.toString());
}
