'use server';
import {
  TwoLevelCacheImplementation,
  getFromTwoLevelCache,
  setToTwoLevelCache,
} from '../cache/TwoLevelCache';
import {
  AccessTrackerImplementation,
  getFrequentKeys,
  getPredictedNextKeys,
} from './AccessTracker';
import getConfig from '../config/config';

/**
 * PrefetcherImplementation interface defines the methods that a prefetcher implementation should provide.
 * It includes methods for prefetching frequent items and prefetching related items based on a given key.
 */
interface PrefetcherImplementation {
  /**
   * prefetchFrequentItems method prefetches frequent items based on the prefetch threshold.
   * It retrieves the frequent keys from the access tracker and prefetches the corresponding values into the cache.
   */
  prefetchFrequentItems(): Promise<void>;

  /**
   * prefetchRelatedItems method prefetches related items based on the provided key.
   * It retrieves the predicted next keys from the access tracker and prefetches the corresponding values into the cache.
   * @param key The key for which to prefetch related items.
   */
  prefetchRelatedItems(key: string): Promise<void>;
}

let prefetcherInstance: PrefetcherImplementation | null = null;

/**
 * createPrefetcherImplementation function creates a new instance of the PrefetcherImplementation.
 * It takes a two-level cache implementation and an access tracker implementation as parameters.
 * @param cache The two-level cache implementation to use for prefetching.
 * @param accessTracker The access tracker implementation to use for retrieving frequent and related keys.
 * @returns A Promise that resolves to an instance of the PrefetcherImplementation.
 */
async function createPrefetcherImplementation(
  cache: TwoLevelCacheImplementation,
  accessTracker: AccessTrackerImplementation,
): Promise<PrefetcherImplementation> {
  const config = await getConfig();

  return {
    async prefetchFrequentItems(): Promise<void> {
      const frequentKeys = await getFrequentKeys(config.prefetchThreshold);
      for (const key of frequentKeys) {
        if (!(await getFromTwoLevelCache(cache, key))) {
          const value = await getFromTwoLevelCache(cache, key);
          if (value) {
            await setToTwoLevelCache(cache, key, value, new Date(Date.now() + config.cacheMaxAge));
          }
        }
      }
    },

    async prefetchRelatedItems(key: string): Promise<void> {
      const relatedKeys = await getPredictedNextKeys(key);
      for (const relatedKey of relatedKeys) {
        if (!(await getFromTwoLevelCache(cache, relatedKey))) {
          const value = await getFromTwoLevelCache(cache, relatedKey);
          if (value) {
            await setToTwoLevelCache(
              cache,
              relatedKey,
              value,
              new Date(Date.now() + config.cacheMaxAge),
            );
          }
        }
      }
    },
  };
}

/**
 * createPrefetcher function creates a new instance of the PrefetcherImplementation.
 * It takes a two-level cache implementation and an access tracker implementation as parameters.
 * @param cache The two-level cache implementation to use for prefetching.
 * @param accessTracker The access tracker implementation to use for retrieving frequent and related keys.
 * @returns A Promise that resolves to an instance of the PrefetcherImplementation.
 */
export async function createPrefetcher(
  cache: TwoLevelCacheImplementation,
  accessTracker: AccessTrackerImplementation,
): Promise<PrefetcherImplementation> {
  if (!prefetcherInstance) {
    prefetcherInstance = await createPrefetcherImplementation(cache, accessTracker);
  }
  return prefetcherInstance;
}

/**
 * prefetchFrequentItems function prefetches frequent items using the provided prefetcher.
 * @param prefetcher The prefetcher to use for prefetching frequent items.
 */
export async function prefetchFrequentItems(prefetcher: PrefetcherImplementation): Promise<void> {
  await prefetcher.prefetchFrequentItems();
}

/**
 * prefetchRelatedItems function prefetches related items based on the provided key using the provided prefetcher.
 * @param prefetcher The prefetcher to use for prefetching related items.
 * @param key The key for which to prefetch related items.
 */
export async function prefetchRelatedItems(
  prefetcher: PrefetcherImplementation,
  key: string,
): Promise<void> {
  await prefetcher.prefetchRelatedItems(key);
}
