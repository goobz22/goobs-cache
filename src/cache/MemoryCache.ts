'use server';

import { LRUCache } from 'lru-cache';
import {
  StorageInterface,
  EncryptedValue,
  CacheItem,
  EvictionPolicy,
  MemoryCacheImplementation,
  CacheStatistics,
  CacheConfig,
} from '../types';
import { compressData, decompressData } from '../utils/Compression';

let memoryCache: MemoryCacheImplementation<EncryptedValue> | null = null;

/**
 * Creates a new memory cache implementation with the specified configuration.
 * @template T The type of the cached values.
 * @param config The cache configuration.
 * @returns The created memory cache implementation.
 */
function createMemoryCacheImplementation<T>(config: CacheConfig): MemoryCacheImplementation<T> {
  let evictionPolicy: EvictionPolicy = config.evictionPolicy || 'lru';
  let hitCount = 0;
  let missCount = 0;
  let evictionCount = 0;
  let totalAccessTime = 0;
  let accessCount = 0;

  let cache = new LRUCache<string, CacheItem<T>>({
    max: config.cacheSize,
    ttl: config.cacheMaxAge,
    updateAgeOnGet: true,
    dispose: (value, key) => {
      evictionCount++;
    },
  });

  /**
   * Determines whether a value should be compressed based on its size.
   * @param value The value to check.
   * @returns True if the value should be compressed, false otherwise.
   */
  const shouldCompress = (value: T): boolean => {
    const stringValue = JSON.stringify(value);
    return stringValue.length > 1024; // Compress if larger than 1KB
  };

  /**
   * Compresses a cache item if it meets the compression criteria.
   * @param item The cache item to compress.
   * @returns The compressed cache item.
   */
  const compressItem = async (item: CacheItem<T>): Promise<CacheItem<T>> => {
    if (!item.compressed && shouldCompress(item.value)) {
      const compressedValue = await compressData(JSON.stringify(item.value));
      return {
        ...item,
        value: compressedValue as any,
        compressed: true,
        size: compressedValue.length,
      };
    }
    return item;
  };

  /**
   * Decompresses a compressed cache item.
   * @param item The cache item to decompress.
   * @returns The decompressed value.
   */
  const decompressItem = async (item: CacheItem<T>): Promise<T> => {
    if (item.compressed) {
      const decompressedValue = await decompressData(item.value as any);
      return JSON.parse(decompressedValue);
    }
    return item.value;
  };

  /**
   * Calculates the size of an item in bytes.
   * @param value The value to calculate the size of.
   * @returns The size of the item in bytes.
   */
  const calculateItemSize = (value: T): number => {
    return Buffer.from(JSON.stringify(value)).length;
  };

  /**
   * Updates the cache statistics based on the access result and time.
   * @param hit Whether the access was a cache hit or miss.
   * @param accessTime The time taken for the access operation.
   */
  const updateStatistics = (hit: boolean, accessTime: number) => {
    if (hit) {
      hitCount++;
    } else {
      missCount++;
    }
    totalAccessTime += accessTime;
    accessCount++;
  };

  /**
   * Retrieves the current cache statistics.
   * @returns The cache statistics.
   */
  const getStatistics = async (): Promise<CacheStatistics> => {
    const totalRequests = hitCount + missCount;
    return {
      hitRate: totalRequests > 0 ? hitCount / totalRequests : 0,
      missRate: totalRequests > 0 ? missCount / totalRequests : 0,
      evictionCount,
      totalItems: cache.size,
      memoryUsage: process.memoryUsage().heapUsed,
      averageAccessTime: accessCount > 0 ? totalAccessTime / accessCount : 0,
      memorySize: cache.size,
    };
  };

  /**
   * Resizes the cache to the specified new size.
   * @param newSize The new cache size.
   */
  const resize = async (newSize: number): Promise<void> => {
    const oldCache = cache;
    cache = new LRUCache<string, CacheItem<T>>({
      max: newSize,
      ttl: config.cacheMaxAge,
      updateAgeOnGet: true,
      dispose: (value, key) => {
        evictionCount++;
      },
    });

    for (const [key, value] of oldCache.entries()) {
      cache.set(key, value);
    }
  };

  /**
   * Sets the eviction policy for the cache.
   * @param policy The eviction policy to set.
   */
  const setEvictionPolicy = async (policy: EvictionPolicy): Promise<void> => {
    evictionPolicy = policy;
    switch (policy) {
      case 'lfu':
        cache.allowStale = true;
        cache.updateAgeOnGet = false;
        break;
      case 'lru':
      case 'adaptive':
      default:
        cache.allowStale = false;
        cache.updateAgeOnGet = true;
        break;
    }
  };

  /**
   * Automatically tunes the cache based on its performance statistics.
   */
  const autoTune = async (): Promise<void> => {
    const stats = await getStatistics();
    const currentSize = cache.max;

    if (stats.hitRate < 0.7 && currentSize < config.maxMemoryUsage) {
      await resize(Math.min(currentSize * 1.1, config.maxMemoryUsage));
    } else if (stats.hitRate > 0.9 && currentSize > config.cacheSize / 2) {
      await resize(Math.max(currentSize * 0.9, config.cacheSize / 2));
    }

    if (stats.averageAccessTime > 10) {
      await setEvictionPolicy('lfu');
    } else if (stats.evictionCount > stats.totalItems * 0.1) {
      await setEvictionPolicy('lru');
    } else {
      await setEvictionPolicy('adaptive');
    }

    hitCount = 0;
    missCount = 0;
    evictionCount = 0;
    totalAccessTime = 0;
    accessCount = 0;
  };

  setInterval(autoTune, config.autoTuneInterval);

  return {
    /**
     * Retrieves an item from the cache by its key.
     * @param key The key of the item to retrieve.
     * @returns The value of the item if found, undefined otherwise.
     */
    async get(key: string): Promise<T | undefined> {
      const start = performance.now();
      const item = cache.get(key);
      const end = performance.now();

      if (item) {
        updateStatistics(true, end - start);
        item.hitCount++;
        item.lastAccessed = Date.now();
        return await decompressItem(item);
      }

      updateStatistics(false, end - start);
      return undefined;
    },

    /**
     * Sets an item in the cache with the specified key, value, and expiration date.
     * @param key The key of the item to set.
     * @param value The value of the item to set.
     * @param expirationDate The expiration date of the item.
     */
    async set(key: string, value: T, expirationDate: Date): Promise<void> {
      const item: CacheItem<T> = {
        value,
        lastAccessed: Date.now(),
        expirationDate,
        hitCount: 0,
        compressed: false,
        size: calculateItemSize(value),
      };
      const compressedItem = await compressItem(item);
      cache.set(key, compressedItem);
    },

    /**
     * Deletes an item from the cache by its key.
     * @param key The key of the item to delete.
     */
    async delete(key: string): Promise<void> {
      cache.delete(key);
    },

    /**
     * Clears all items from the cache.
     */
    async clear(): Promise<void> {
      cache.clear();
      hitCount = 0;
      missCount = 0;
      evictionCount = 0;
      totalAccessTime = 0;
      accessCount = 0;
    },

    resize,
    setEvictionPolicy,
    getStatistics,
    autoTune,
  };
}

/**
 * Creates a new memory cache with the specified configuration.
 * @template T The type of the cached values.
 * @param config The cache configuration.
 * @returns The created memory cache implementation.
 */
export async function createMemoryCache<T>(
  config: CacheConfig,
): Promise<MemoryCacheImplementation<T>> {
  return createMemoryCacheImplementation<T>(config);
}

/**
 * Retrieves or creates the memory cache based on the specified configuration.
 * @param config The cache configuration.
 * @returns The memory cache implementation.
 */
async function getOrCreateMemoryCache(
  config: CacheConfig,
): Promise<MemoryCacheImplementation<EncryptedValue>> {
  if (!memoryCache) {
    memoryCache = await createMemoryCache<EncryptedValue>(config);
  }
  return memoryCache;
}

/**
 * Retrieves an item from the memory storage by its key.
 * @param config The cache configuration.
 * @param key The key of the item to retrieve.
 * @returns The cache item if found, undefined otherwise.
 */
export async function getFromMemoryStorage(
  config: CacheConfig,
  key: string,
): Promise<CacheItem<EncryptedValue> | undefined> {
  const cache = await getOrCreateMemoryCache(config);
  const value = await cache.get(key);
  if (value) {
    return {
      value,
      lastAccessed: Date.now(),
      expirationDate: new Date(),
      hitCount: 0,
      compressed: false,
      size: calculateItemSize(value),
    };
  }
  return undefined;
}

/**
 * Sets an item in the memory storage with the specified key and cache item.
 * @param config The cache configuration.
 * @param key The key of the item to set.
 * @param item The cache item to set.
 */
export async function setToMemoryStorage(
  config: CacheConfig,
  key: string,
  item: CacheItem<EncryptedValue>,
): Promise<void> {
  const cache = await getOrCreateMemoryCache(config);
  await cache.set(key, item.value, item.expirationDate);
}

/**
 * Removes an item from the memory storage by its key.
 * @param config The cache configuration.
 * @param key The key of the item to remove.
 */
export async function removeFromMemoryStorage(config: CacheConfig, key: string): Promise<void> {
  const cache = await getOrCreateMemoryCache(config);
  await cache.delete(key);
}

/**
 * Clears all items from the memory storage.
 * @param config The cache configuration.
 */
export async function clearMemoryStorage(config: CacheConfig): Promise<void> {
  const cache = await getOrCreateMemoryCache(config);
  await cache.clear();
}

/**
 * Creates a new memory storage with the specified configuration.
 * @param config The cache configuration.
 * @returns The created storage interface.
 */
export async function createMemoryStorage(config: CacheConfig): Promise<StorageInterface> {
  const cache = await getOrCreateMemoryCache(config);
  return {
    get: (key: string) => getFromMemoryStorage(config, key),
    set: (key: string, item: CacheItem<EncryptedValue>) => setToMemoryStorage(config, key, item),
    remove: (key: string) => removeFromMemoryStorage(config, key),
    clear: () => clearMemoryStorage(config),
    getStatistics: cache.getStatistics,
    setEvictionPolicy: cache.setEvictionPolicy,
    autoTune: cache.autoTune,
  };
}

/**
 * Calculates the size of an item in bytes.
 * @param value The value to calculate the size of.
 * @returns The size of the item in bytes.
 */
function calculateItemSize(value: any): number {
  return Buffer.from(JSON.stringify(value)).length;
}

/**
 * Retrieves an item from the memory cache by its key.
 * @template T The type of the cached values.
 * @param cache The memory cache implementation.
 * @param key The key of the item to retrieve.
 * @returns The value of the item if found, undefined otherwise.
 */
export async function getFromMemoryCache<T>(
  cache: MemoryCacheImplementation<T>,
  key: string,
): Promise<T | undefined> {
  return await cache.get(key);
}

/**
 * Sets an item in the memory cache with the specified key, value, and expiration date.
 * @template T The type of the cached values.
 * @param cache The memory cache implementation.
 * @param key The key of the item to set.
 * @param value The value of the item to set.
 * @param expirationDate The expiration date of the item.
 */
export async function setToMemoryCache<T>(
  cache: MemoryCacheImplementation<T>,
  key: string,
  value: T,
  expirationDate: Date,
): Promise<void> {
  await cache.set(key, value, expirationDate);
}

/**
 * Deletes an item from the memory cache by its key.
 * @template T The type of the cached values.
 * @param cache The memory cache implementation.
 * @param key The key of the item to delete.
 */
export async function deleteFromMemoryCache<T>(
  cache: MemoryCacheImplementation<T>,
  key: string,
): Promise<void> {
  await cache.delete(key);
}

/**
 * Clears all items from the memory cache.
 * @template T The type of the cached values.
 * @param cache The memory cache implementation.
 */
export async function clearMemoryCache<T>(cache: MemoryCacheImplementation<T>): Promise<void> {
  await cache.clear();
}

/**
 * Resizes the memory cache to the specified new size.
 * @template T The type of the cached values.
 * @param cache The memory cache implementation.
 * @param newSize The new cache size.
 */
export async function resizeMemoryCache<T>(
  cache: MemoryCacheImplementation<T>,
  newSize: number,
): Promise<void> {
  await cache.resize(newSize);
}

export type { MemoryCacheImplementation };
