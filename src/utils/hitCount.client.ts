'use client';

export const HitCountModule = (function () {
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

  return {
    getHitCounts(
      get: (key: string) => string | null,
      identifier: string,
      storeName: string,
    ): { getHitCount: number; setHitCount: number } {
      const getHitCountKey = getCacheGetHitCountKey(identifier, storeName);
      const setHitCountKey = getCacheSetHitCountKey(identifier, storeName);

      const getHitCount = parseCacheHitCount(get(getHitCountKey));
      const setHitCount = parseCacheHitCount(get(setHitCountKey));

      return { getHitCount, setHitCount };
    },

    incrementGetHitCount(
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
    },

    incrementSetHitCount(
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
    },

    setHitCounts(
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
    },

    // Expose utility functions for potential external use
    getCacheGetHitCountKey,
    getCacheSetHitCountKey,
    parseCacheHitCount,
    incrementCacheHitCount,
  };
})();

// Remove or comment out the unhandled rejection handler
// if (typeof window !== 'undefined') {
//   window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
//     // No-op
//   });
// }

export default HitCountModule;
