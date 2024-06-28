'use server';
import { LRUCache } from 'lru-cache';
import { StorageInterface } from '../storage/StorageInterface';
import { EncryptedValue } from '../types/DataTypes';
import getConfig from '../config/config';

/**
 * CacheItem interface represents a single item stored in the cache.
 * It contains the encrypted value, the timestamp of its last access,
 * and the expiration date.
 */
interface CacheItem {
  value: EncryptedValue;
  lastAccessed: number;
  expirationDate: Date;
}

/**
 * TwoLevelCacheImplementation interface defines the methods that a two-level cache
 * implementation should provide, such as get, set, remove, and resizeCache.
 */
export interface TwoLevelCacheImplementation {
  get(key: string): Promise<EncryptedValue | undefined>;
  set(key: string, value: EncryptedValue, expirationDate: Date): Promise<void>;
  remove(key: string): Promise<void>;
  resizeCache(newSize: number): Promise<void>;
}

/**
 * TwoLevelCacheImpl class is an implementation of the TwoLevelCacheImplementation interface.
 * It uses an LRUCache for the memory cache and a StorageInterface for persistent storage.
 */
class TwoLevelCacheImpl implements TwoLevelCacheImplementation {
  private memoryCache: LRUCache<string, CacheItem>;
  private storage: StorageInterface;

  /**
   * Constructor for the TwoLevelCacheImpl class.
   * @param storage The storage interface for persistent storage.
   * @param cacheSize The maximum number of items to store in the memory cache.
   * @param cacheMaxAge The maximum age (in milliseconds) of items in the memory cache.
   */
  constructor(storage: StorageInterface, cacheSize: number, cacheMaxAge: number) {
    this.memoryCache = new LRUCache<string, CacheItem>({
      max: cacheSize,
      ttl: cacheMaxAge,
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
    const item: CacheItem = {
      value,
      lastAccessed: Date.now(),
      expirationDate,
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
    this.memoryCache = new LRUCache<string, CacheItem>({
      max: newSize,
      ttl: this.memoryCache.ttl,
    });
    for (const [key, value] of oldCache.entries()) {
      this.memoryCache.set(key, value);
    }
  }
}

/**
 * createTwoLevelCache function creates a new instance of the TwoLevelCacheImpl class
 * using the provided storage interface and the configuration obtained from the 'config' module.
 * @param storage The storage interface for persistent storage.
 * @returns A new instance of the TwoLevelCacheImpl class.
 */
export async function createTwoLevelCache(
  storage: StorageInterface,
): Promise<TwoLevelCacheImplementation> {
  const config = await getConfig();
  return new TwoLevelCacheImpl(storage, config.cacheSize, config.cacheMaxAge);
}

/**
 * getFromTwoLevelCache function retrieves an item from the specified two-level cache by its key.
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
 * @param cache The two-level cache implementation.
 * @param newSize The new maximum size of the memory cache.
 */
export async function resizeTwoLevelCache(
  cache: TwoLevelCacheImplementation,
  newSize: number,
): Promise<void> {
  await cache.resizeCache(newSize);
}
