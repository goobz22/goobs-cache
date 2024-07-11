import { CacheStatistics, EvictionPolicy } from '../types';

export async function autoTune(
  stats: CacheStatistics,
  currentSize: number,
  maxMemoryUsage: number,
  baseCacheSize: number,
  resizeCache: (newSize: number) => Promise<void>,
  setEvictionPolicy: (policy: EvictionPolicy) => Promise<void>,
): Promise<void> {
  if (stats.hitRate < 0.7 && currentSize < maxMemoryUsage) {
    await resizeCache(Math.min(currentSize * 1.1, maxMemoryUsage));
  } else if (stats.hitRate > 0.9 && currentSize > baseCacheSize / 2) {
    await resizeCache(Math.max(currentSize * 0.9, baseCacheSize / 2));
  }

  if (stats.averageAccessTime > 10) {
    await setEvictionPolicy('lfu');
  } else if (stats.evictionCount > stats.totalItems * 0.1) {
    await setEvictionPolicy('lru');
  } else {
    await setEvictionPolicy('adaptive');
  }
}
