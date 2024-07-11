'use server';

import { CacheConfig, EncryptedValue, CacheItem } from '../types';

export interface PrefetcherImplementation {
  prefetchFrequentItems(): Promise<void>;
  prefetchRelatedItems(key: string): Promise<void>;
}

let prefetcherInstance: PrefetcherImplementation | null = null;

async function createPrefetcherImplementation(
  cache: {
    get(key: string): Promise<CacheItem<EncryptedValue> | undefined>;
    set(key: string, value: CacheItem<EncryptedValue>, expirationDate: Date): Promise<void>;
  },
  accessTracker: {
    getFrequentKeys(threshold: number): Promise<string[]>;
    getPredictedNextKeys(key: string): Promise<string[]>;
  },
  config: CacheConfig,
): Promise<PrefetcherImplementation> {
  return {
    async prefetchFrequentItems(): Promise<void> {
      const frequentKeys = await accessTracker.getFrequentKeys(config.prefetchThreshold);
      for (const key of frequentKeys) {
        const value = await cache.get(key);
        if (value) {
          await cache.set(key, value, new Date(Date.now() + config.cacheMaxAge));
        }
      }
    },

    async prefetchRelatedItems(key: string): Promise<void> {
      const relatedKeys = await accessTracker.getPredictedNextKeys(key);
      for (const relatedKey of relatedKeys) {
        const value = await cache.get(relatedKey);
        if (value) {
          await cache.set(relatedKey, value, new Date(Date.now() + config.cacheMaxAge));
        }
      }
    },
  };
}

export async function createPrefetcher(
  cache: {
    get(key: string): Promise<CacheItem<EncryptedValue> | undefined>;
    set(key: string, value: CacheItem<EncryptedValue>, expirationDate: Date): Promise<void>;
  },
  accessTracker: {
    getFrequentKeys(threshold: number): Promise<string[]>;
    getPredictedNextKeys(key: string): Promise<string[]>;
  },
  config: CacheConfig,
): Promise<PrefetcherImplementation> {
  if (!prefetcherInstance) {
    prefetcherInstance = await createPrefetcherImplementation(cache, accessTracker, config);
  }
  return prefetcherInstance;
}

export async function prefetchFrequentItems(prefetcher: PrefetcherImplementation): Promise<void> {
  await prefetcher.prefetchFrequentItems();
}

export async function prefetchRelatedItems(
  prefetcher: PrefetcherImplementation,
  key: string,
): Promise<void> {
  await prefetcher.prefetchRelatedItems(key);
}
