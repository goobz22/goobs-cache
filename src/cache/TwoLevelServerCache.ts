'use server';
import { LRUCache } from 'lru-cache';
import {
  StorageInterface,
  EncryptedValue,
  CacheItem,
  TwoLevelCacheImplementation,
  CacheConfig,
  CacheStatistics,
  EvictionPolicy,
} from '../types';

/**
 * TwoLevelCacheImpl class is an implementation of the TwoLevelCacheImplementation interface.
 * It uses an LRUCache for the memory cache and a StorageInterface for persistent storage.
 */
class TwoLevelCacheImpl implements TwoLevelCacheImplementation {
  private memoryCache: LRUCache<string, CacheItem<EncryptedValue>>;
  private storage: StorageInterface;

  /**
   * Constructor for the TwoLevelCacheImpl class.
   * @param storage The storage interface for persistent storage.
   * @param config The cache configuration.
   */
  constructor(storage: StorageInterface, config: CacheConfig) {
    this.memoryCache = new LRUCache<string, CacheItem<EncryptedValue>>({
      max: config.cacheSize,
      ttl: config.cacheMaxAge,
    });
    this.storage = storage;
  }

  /**
   * get method retrieves an item from the cache by its key.
   * It first checks the memory cache and returns the item if found and not expired.
   * If the item is not found or expired in the memory cache, it retrieves it from the storage.
   * @param key The key of the item to retrieve.
   * @returns The encrypted value of the item, or undefined if not found.
   */
  async get(key: string): Promise<EncryptedValue | undefined> {
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && memoryItem.expirationDate > new Date()) {
      return memoryItem.value;
    }
    const storageItem = await this.storage.get(key);
    if (storageItem) {
      this.memoryCache.set(key, storageItem);
      return storageItem.value;
    }
    return undefined;
  }

  /**
   * set method adds a new item to the cache with the specified key, value, and expiration date.
   * It adds the item to both the memory cache and the storage.
   * @param key The key of the item to add.
   * @param value The encrypted value of the item.
   * @param expirationDate The expiration date of the item.
   */
  async set(key: string, value: EncryptedValue, expirationDate: Date): Promise<void> {
    const item: CacheItem<EncryptedValue> = {
      value,
      lastAccessed: Date.now(),
      expirationDate,
      hitCount: 0,
      compressed: false,
      size: Buffer.from(JSON.stringify(value)).length,
    };
    this.memoryCache.set(key, item);
    await this.storage.set(key, item);
  }

  /**
   * remove method removes an item from the cache by its key.
   * It removes the item from both the memory cache and the storage.
   * @param key The key of the item to remove.
   */
  async remove(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.storage.remove(key);
  }

  /**
   * resizeCache method changes the maximum size of the memory cache.
   * It creates a new cache with the new size and copies all items from the old cache.
   * @param newSize The new maximum size of the memory cache.
   */
  async resizeCache(newSize: number): Promise<void> {
    const oldCache = this.memoryCache;
    this.memoryCache = new LRUCache<string, CacheItem<EncryptedValue>>({
      max: newSize,
      ttl: oldCache.ttl,
    });
    for (const [key, value] of oldCache.entries()) {
      this.memoryCache.set(key, value);
    }
  }

  /**
   * clear method removes all items from both the memory cache and the storage.
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    await this.storage.clear();
  }

  /**
   * getStatistics method retrieves the current cache statistics.
   * It combines the statistics from the storage with the memory cache size.
   * @returns The current cache statistics.
   */
  async getStatistics(): Promise<CacheStatistics> {
    const storageStats = await this.storage.getStatistics();
    return {
      ...storageStats,
      memorySize: this.memoryCache.size,
    };
  }

  /**
   * setEvictionPolicy method sets the eviction policy for the cache.
   * It is a placeholder for implementing the logic to change the eviction policy.
   * @param policy The new eviction policy.
   */
  async setEvictionPolicy(policy: EvictionPolicy): Promise<void> {
    // Implement eviction policy change logic here
    // This might involve recreating the LRUCache with new options
  }

  /**
   * autoTune method is a placeholder for implementing auto-tuning logic for the cache.
   * It can analyze cache statistics and adjust cache size or policies based on the analysis.
   */
  async autoTune(): Promise<void> {
    // Implement auto-tuning logic here
    // This might involve analyzing cache statistics and adjusting cache size or policies
  }
}

/**
 * createTwoLevelCache function creates a new instance of the TwoLevelCacheImpl class
 * using the provided storage interface and configuration.
 * @param storage The storage interface for persistent storage.
 * @param config The cache configuration.
 * @returns A new instance of the TwoLevelCacheImpl class.
 */
export async function createTwoLevelCache(
  storage: StorageInterface,
  config: CacheConfig,
): Promise<TwoLevelCacheImplementation> {
  return new TwoLevelCacheImpl(storage, config);
}

/**
 * getFromTwoLevelCache function retrieves an item from the specified two-level cache by its key.
 * It calls the get method of the cache implementation.
 * @param cache The two-level cache implementation.
 * @param key The key of the item to retrieve.
 * @returns The encrypted value of the item, or undefined if not found.
 */
export async function getFromTwoLevelCache(
  cache: TwoLevelCacheImplementation,
  key: string,
): Promise<EncryptedValue | undefined> {
  return await cache.get(key);
}

/**
 * setToTwoLevelCache function adds a new item to the specified two-level cache
 * with the specified key, value, and expiration date.
 * It calls the set method of the cache implementation.
 * @param cache The two-level cache implementation.
 * @param key The key of the item to add.
 * @param value The encrypted value of the item.
 * @param expirationDate The expiration date of the item.
 */
export async function setToTwoLevelCache(
  cache: TwoLevelCacheImplementation,
  key: string,
  value: EncryptedValue,
  expirationDate: Date,
): Promise<void> {
  await cache.set(key, value, expirationDate);
}

/**
 * removeFromTwoLevelCache function removes an item from the specified two-level cache by its key.
 * It calls the remove method of the cache implementation.
 * @param cache The two-level cache implementation.
 * @param key The key of the item to remove.
 */
export async function removeFromTwoLevelCache(
  cache: TwoLevelCacheImplementation,
  key: string,
): Promise<void> {
  await cache.remove(key);
}

/**
 * resizeTwoLevelCache function changes the maximum size of the memory cache
 * in the specified two-level cache.
 * It calls the resizeCache method of the cache implementation.
 * @param cache The two-level cache implementation.
 * @param newSize The new maximum size of the memory cache.
 */
export async function resizeTwoLevelCache(
  cache: TwoLevelCacheImplementation,
  newSize: number,
): Promise<void> {
  await cache.resizeCache(newSize);
}

/**
 * clearTwoLevelCache function removes all items from the specified two-level cache.
 * It calls the clear method of the cache implementation.
 * @param cache The two-level cache implementation.
 */
export async function clearTwoLevelCache(cache: TwoLevelCacheImplementation): Promise<void> {
  await cache.clear();
}

/**
 * getTwoLevelCacheStatistics function retrieves the current statistics of the specified two-level cache.
 * It calls the getStatistics method of the cache implementation.
 * @param cache The two-level cache implementation.
 * @returns The current cache statistics.
 */
export async function getTwoLevelCacheStatistics(
  cache: TwoLevelCacheImplementation,
): Promise<CacheStatistics> {
  return await cache.getStatistics();
}

/**
 * setTwoLevelCacheEvictionPolicy function sets the eviction policy for the specified two-level cache.
 * It calls the setEvictionPolicy method of the cache implementation.
 * @param cache The two-level cache implementation.
 * @param policy The new eviction policy.
 */
export async function setTwoLevelCacheEvictionPolicy(
  cache: TwoLevelCacheImplementation,
  policy: EvictionPolicy,
): Promise<void> {
  await cache.setEvictionPolicy(policy);
}

/**
 * autoTuneTwoLevelCache function triggers the auto-tuning mechanism for the specified two-level cache.
 * It calls the autoTune method of the cache implementation.
 * @param cache The two-level cache implementation.
 */
export async function autoTuneTwoLevelCache(cache: TwoLevelCacheImplementation): Promise<void> {
  await cache.autoTune();
}

export type { TwoLevelCacheImplementation };
