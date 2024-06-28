'use server';
import { StorageInterface, CacheItem } from './StorageInterface';
import { EncryptedValue } from '../types/DataTypes';
import {
  createMemoryCache,
  getFromMemoryCache,
  setToMemoryCache,
  deleteFromMemoryCache,
  clearMemoryCache,
  MemoryCacheImplementation,
} from '../cache/MemoryCache';

let memoryCache: MemoryCacheImplementation<EncryptedValue> | null = null;

/**
 * getOrCreateMemoryCache function retrieves the existing memory cache or creates a new one if it doesn't exist.
 * @returns A Promise that resolves to the memory cache implementation for encrypted values.
 */
async function getOrCreateMemoryCache(): Promise<MemoryCacheImplementation<EncryptedValue>> {
  if (!memoryCache) {
    memoryCache = await createMemoryCache<EncryptedValue>();
  }
  return memoryCache;
}

/**
 * getFromMemoryStorage function retrieves a cache item from the memory storage.
 * It retrieves the memory cache and gets the item from the cache using the provided key.
 * @param key The key of the cache item to retrieve.
 * @returns A Promise that resolves to the cache item if found, or undefined if not found.
 */
export async function getFromMemoryStorage(
  key: string,
): Promise<CacheItem<EncryptedValue> | undefined> {
  const cache = await getOrCreateMemoryCache();
  const item = await getFromMemoryCache<EncryptedValue>(cache, key);
  if (item) {
    return {
      value: item.value,
      lastAccessed: item.lastAccessed,
      expirationDate: item.expirationDate,
    };
  }
  return undefined;
}

/**
 * setToMemoryStorage function sets a cache item in the memory storage.
 * It retrieves the memory cache and sets the item in the cache using the provided key, value, and expiration date.
 * @param key The key of the cache item to set.
 * @param item The cache item to set.
 */
export async function setToMemoryStorage(
  key: string,
  item: CacheItem<EncryptedValue>,
): Promise<void> {
  const cache = await getOrCreateMemoryCache();
  await setToMemoryCache<EncryptedValue>(cache, key, item.value, item.expirationDate);
}

/**
 * removeFromMemoryStorage function removes a cache item from the memory storage.
 * It retrieves the memory cache and deletes the item from the cache using the provided key.
 * @param key The key of the cache item to remove.
 */
export async function removeFromMemoryStorage(key: string): Promise<void> {
  const cache = await getOrCreateMemoryCache();
  await deleteFromMemoryCache<EncryptedValue>(cache, key);
}

/**
 * clearMemoryStorage function clears all cache items from the memory storage.
 * It retrieves the memory cache and clears all items from the cache.
 */
export async function clearMemoryStorage(): Promise<void> {
  const cache = await getOrCreateMemoryCache();
  await clearMemoryCache<EncryptedValue>(cache);
}

/**
 * createMemoryStorage function creates a new instance of the StorageInterface using memory storage.
 * It returns an object that implements the StorageInterface, with methods for get, set, remove, and clear operations.
 * @returns A Promise that resolves to the StorageInterface instance using memory storage.
 */
export async function createMemoryStorage(): Promise<StorageInterface> {
  return {
    get: getFromMemoryStorage,
    set: setToMemoryStorage,
    remove: removeFromMemoryStorage,
    clear: clearMemoryStorage,
  };
}
