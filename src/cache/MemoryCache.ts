'use server';
import { LRUCache } from 'lru-cache';
import getConfig from '../config/config';

/**
 * CacheItem interface represents a single item stored in the cache.
 * It contains the value of the item, the timestamp of its last access,
 * and the expiration date.
 */
export interface CacheItem<T> {
  value: T;
  lastAccessed: number;
  expirationDate: Date;
}

/**
 * MemoryCacheImplementation interface defines the methods that a memory cache
 * implementation should provide, such as get, set, delete, clear, and resize.
 */
export interface MemoryCacheImplementation<T> {
  get(key: string): Promise<CacheItem<T> | undefined>;
  set(key: string, value: T, expirationDate: Date): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  resize(newSize: number): Promise<void>;
}

/**
 * createMemoryCacheImplementation function creates a new instance of the memory cache
 * using the LRUCache class from the 'lru-cache' package. It takes the maximum size
 * and maximum age of the cache items as parameters.
 */
function createMemoryCacheImplementation<T>(
  maxSize: number,
  maxAge: number,
): MemoryCacheImplementation<T> {
  const cache = new LRUCache<string, CacheItem<T>>({
    max: maxSize,
    ttl: maxAge,
  });

  return {
    /**
     * get method retrieves a cache item by its key.
     */
    async get(key: string): Promise<CacheItem<T> | undefined> {
      return cache.get(key);
    },

    /**
     * set method adds a new cache item with the specified key, value, and expiration date.
     */
    async set(key: string, value: T, expirationDate: Date): Promise<void> {
      const item: CacheItem<T> = {
        value,
        lastAccessed: Date.now(),
        expirationDate,
      };
      cache.set(key, item);
    },

    /**
     * delete method removes a cache item by its key.
     */
    async delete(key: string): Promise<void> {
      cache.delete(key);
    },

    /**
     * clear method removes all items from the cache.
     */
    async clear(): Promise<void> {
      cache.clear();
    },

    /**
     * resize method changes the maximum size of the cache.
     * It creates a new cache with the new size and copies all items from the old cache.
     */
    async resize(newSize: number): Promise<void> {
      const oldCache = cache;
      const newCache = new LRUCache<string, CacheItem<T>>({
        max: newSize,
        ttl: cache.ttl,
      });
      for (const [key, value] of oldCache.entries()) {
        newCache.set(key, value);
      }
      Object.assign(cache, newCache);
    },
  };
}

/**
 * createMemoryCache function creates a new memory cache instance using the configuration
 * obtained from the 'config' module.
 */
export async function createMemoryCache<T>(): Promise<MemoryCacheImplementation<T>> {
  const config = await getConfig();
  return createMemoryCacheImplementation<T>(config.cacheSize, config.cacheMaxAge);
}

/**
 * getFromMemoryCache function retrieves a cache item by its key from the specified cache.
 */
export async function getFromMemoryCache<T>(
  cache: MemoryCacheImplementation<T>,
  key: string,
): Promise<CacheItem<T> | undefined> {
  return await cache.get(key);
}

/**
 * setToMemoryCache function adds a new cache item with the specified key, value, and expiration date
 * to the specified cache.
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
 * deleteFromMemoryCache function removes a cache item by its key from the specified cache.
 */
export async function deleteFromMemoryCache<T>(
  cache: MemoryCacheImplementation<T>,
  key: string,
): Promise<void> {
  await cache.delete(key);
}

/**
 * clearMemoryCache function removes all items from the specified cache.
 */
export async function clearMemoryCache<T>(cache: MemoryCacheImplementation<T>): Promise<void> {
  await cache.clear();
}

/**
 * resizeMemoryCache function changes the maximum size of the specified cache.
 */
export async function resizeMemoryCache<T>(
  cache: MemoryCacheImplementation<T>,
  newSize: number,
): Promise<void> {
  await cache.resize(newSize);
}
