/**
 * @file AutoTune.ts
 * @description Provides an automatic tuning function for cache optimization based on usage statistics.
 */

import { CacheStatistics, EvictionPolicy } from '../types';

/**
 * Automatically tunes the cache parameters based on current statistics and usage patterns.
 * This function adjusts the cache size and eviction policy to optimize performance.
 *
 * @async
 * @param {CacheStatistics} stats - Current cache statistics.
 * @param {number} currentSize - Current size of the cache.
 * @param {number} maxMemoryUsage - Maximum allowed memory usage for the cache.
 * @param {number} baseCacheSize - Base (initial) size of the cache.
 * @param {function} resizeCache - Function to resize the cache. Takes a new size as parameter and returns a Promise.
 * @param {function} setEvictionPolicy - Function to set the eviction policy. Takes an EvictionPolicy as parameter and returns a Promise.
 * @returns {Promise<void>} A promise that resolves when auto-tuning is complete.
 *
 * @example
 * await autoTune(
 *   cacheStats,
 *   1000, // current size
 *   2000, // max memory usage
 *   500,  // base cache size
 *   async (newSize) => { // resize function
 *     // Implementation to resize cache
 *   },
 *   async (policy) => { // set eviction policy function
 *     // Implementation to set eviction policy
 *   }
 * );
 */
export async function autoTune(
  stats: CacheStatistics,
  currentSize: number,
  maxMemoryUsage: number,
  baseCacheSize: number,
  resizeCache: (newSize: number) => Promise<void>,
  setEvictionPolicy: (policy: EvictionPolicy) => Promise<void>,
): Promise<void> {
  // Adjust cache size based on hit rate
  if (stats.hitRate < 0.7 && currentSize < maxMemoryUsage) {
    // Increase cache size by 10% if hit rate is low and we're below max memory usage
    await resizeCache(Math.min(currentSize * 1.1, maxMemoryUsage));
  } else if (stats.hitRate > 0.9 && currentSize > baseCacheSize / 2) {
    // Decrease cache size by 10% if hit rate is high and we're above half of base size
    await resizeCache(Math.max(currentSize * 0.9, baseCacheSize / 2));
  }

  // Adjust eviction policy based on access time and eviction rate
  if (stats.averageAccessTime > 10) {
    // Use LFU if average access time is high
    await setEvictionPolicy('lfu');
  } else if (stats.evictionCount > stats.totalItems * 0.1) {
    // Use LRU if eviction rate is high
    await setEvictionPolicy('lru');
  } else {
    // Use adaptive policy as default
    await setEvictionPolicy('adaptive');
  }
}
