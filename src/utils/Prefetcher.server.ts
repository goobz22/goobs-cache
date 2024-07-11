/**
 * @file Prefetcher.ts
 * @description Implements a prefetching mechanism for a caching system to improve performance by preemptively loading frequent and related items.
 */

'use server';

import { CacheConfig, EncryptedValue, CacheItem } from '../types';

/**
 * Defines the interface for the prefetcher implementation.
 * @interface
 */
export interface PrefetcherImplementation {
  /** Prefetches frequently accessed items. */
  prefetchFrequentItems(): Promise<void>;
  /**
   * Prefetches items related to a specific key.
   * @param {string} key - The key for which to prefetch related items.
   */
  prefetchRelatedItems(key: string): Promise<void>;
}

/** Singleton instance of the PrefetcherImplementation. */
let prefetcherInstance: PrefetcherImplementation | null = null;

/**
 * Creates a new instance of the PrefetcherImplementation.
 *
 * @param {Object} cache - The cache object with get and set methods.
 * @param {function} cache.get - Function to get an item from the cache.
 * @param {function} cache.set - Function to set an item in the cache.
 * @param {Object} accessTracker - The access tracker object with methods to get frequent and predicted keys.
 * @param {function} accessTracker.getFrequentKeys - Function to get frequently accessed keys.
 * @param {function} accessTracker.getPredictedNextKeys - Function to get predicted next keys for a given key.
 * @param {CacheConfig} config - The cache configuration.
 * @returns {Promise<PrefetcherImplementation>} A Promise that resolves to a PrefetcherImplementation instance.
 */
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
    /**
     * Prefetches frequently accessed items and updates their expiration time.
     * @returns {Promise<void>}
     */
    async prefetchFrequentItems(): Promise<void> {
      const frequentKeys = await accessTracker.getFrequentKeys(config.prefetchThreshold);
      for (const key of frequentKeys) {
        const value = await cache.get(key);
        if (value) {
          await cache.set(key, value, new Date(Date.now() + config.cacheMaxAge));
        }
      }
    },

    /**
     * Prefetches items related to a specific key and updates their expiration time.
     * @param {string} key - The key for which to prefetch related items.
     * @returns {Promise<void>}
     */
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

/**
 * Creates a new instance of the PrefetcherImplementation or returns the existing one.
 *
 * @param {Object} cache - The cache object with get and set methods.
 * @param {function} cache.get - Function to get an item from the cache.
 * @param {function} cache.set - Function to set an item in the cache.
 * @param {Object} accessTracker - The access tracker object with methods to get frequent and predicted keys.
 * @param {function} accessTracker.getFrequentKeys - Function to get frequently accessed keys.
 * @param {function} accessTracker.getPredictedNextKeys - Function to get predicted next keys for a given key.
 * @param {CacheConfig} config - The cache configuration.
 * @returns {Promise<PrefetcherImplementation>} A Promise that resolves to a PrefetcherImplementation instance.
 */
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

/**
 * Triggers the prefetching of frequently accessed items.
 *
 * @param {PrefetcherImplementation} prefetcher - The prefetcher instance to use.
 * @returns {Promise<void>}
 */
export async function prefetchFrequentItems(prefetcher: PrefetcherImplementation): Promise<void> {
  await prefetcher.prefetchFrequentItems();
}

/**
 * Triggers the prefetching of items related to a specific key.
 *
 * @param {PrefetcherImplementation} prefetcher - The prefetcher instance to use.
 * @param {string} key - The key for which to prefetch related items.
 * @returns {Promise<void>}
 */
export async function prefetchRelatedItems(
  prefetcher: PrefetcherImplementation,
  key: string,
): Promise<void> {
  await prefetcher.prefetchRelatedItems(key);
}
