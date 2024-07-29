// Private utility functions
function getCacheGetHitCountKey(identifier: string, storeName: string): string {
  return `${identifier}:${storeName}:getHitCount`;
}

function getCacheSetHitCountKey(identifier: string, storeName: string): string {
  return `${identifier}:${storeName}:setHitCount`;
}

function parseCacheHitCount(hitCountString: string | null): number {
  return hitCountString ? parseInt(hitCountString, 10) : 0;
}

function incrementCacheHitCount(currentHitCount: number): number {
  return currentHitCount + 1;
}

// Exported functions
export function getHitCounts(
  get: (key: string) => string | null,
  identifier: string,
  storeName: string,
): { getHitCount: number; setHitCount: number } {
  const getHitCountKey = getCacheGetHitCountKey(identifier, storeName);
  const setHitCountKey = getCacheSetHitCountKey(identifier, storeName);

  return {
    getHitCount: parseCacheHitCount(get(getHitCountKey)),
    setHitCount: parseCacheHitCount(get(setHitCountKey)),
  };
}

export function incrementGetHitCount(
  get: (key: string) => string | null,
  set: (key: string, value: string) => void,
  identifier: string,
  storeName: string,
): number {
  const hitCountKey = getCacheGetHitCountKey(identifier, storeName);
  const currentHitCount = parseCacheHitCount(get(hitCountKey));
  const newHitCount = incrementCacheHitCount(currentHitCount);
  set(hitCountKey, newHitCount.toString());
  return newHitCount;
}

export function incrementSetHitCount(
  get: (key: string) => string | null,
  set: (key: string, value: string) => void,
  identifier: string,
  storeName: string,
): number {
  const hitCountKey = getCacheSetHitCountKey(identifier, storeName);
  const currentHitCount = parseCacheHitCount(get(hitCountKey));
  const newHitCount = incrementCacheHitCount(currentHitCount);
  set(hitCountKey, newHitCount.toString());
  return newHitCount;
}

export function setHitCounts(
  set: (key: string, value: string) => void,
  identifier: string,
  storeName: string,
  getHitCount: number,
  setHitCount: number,
): void {
  const getHitCountKey = getCacheGetHitCountKey(identifier, storeName);
  const setHitCountKey = getCacheSetHitCountKey(identifier, storeName);

  set(getHitCountKey, getHitCount.toString());
  set(setHitCountKey, setHitCount.toString());
}
