'use client';

import { EncryptedValue } from '../types/DataTypes';
import { CacheItem } from '../storage/StorageInterface';

/**
 * getClientSessionCache function retrieves the session cache from the client-side storage.
 * It parses the JSON string stored in the sessionStorage and returns the parsed object.
 * @returns The session cache object or an empty object if not found or invalid.
 */
function getClientSessionCache(): Record<string, CacheItem<EncryptedValue>> {
  const cacheString = sessionStorage.getItem('reusableStore');
  if (cacheString) {
    try {
      return JSON.parse(cacheString);
    } catch (error) {
      console.error('Failed to parse session cache', error);
    }
  }
  return {};
}

/**
 * setClientSessionCache function sets the session cache in the client-side storage.
 * It stringifies the provided cache object and stores it in the sessionStorage.
 * @param cache The cache object to store.
 */
function setClientSessionCache(cache: Record<string, CacheItem<EncryptedValue>>) {
  try {
    const cacheString = JSON.stringify(cache);
    sessionStorage.setItem('reusableStore', cacheString);
  } catch (error) {
    console.error('Failed to set session cache', error);
  }
}

/**
 * getFromClientSessionCache function retrieves a cache item from the client-side session cache.
 * @param key The key of the cache item to retrieve.
 * @returns The cache item if found and not expired, or undefined otherwise.
 */
export function getFromClientSessionCache(key: string): CacheItem<EncryptedValue> | undefined {
  const cache = getClientSessionCache();
  const item = cache[key];
  if (item && item.expirationDate > new Date()) {
    return item;
  }
  return undefined;
}

/**
 * setToClientSessionCache function sets a cache item in the client-side session cache.
 * @param key The key of the cache item to set.
 * @param value The encrypted value of the cache item.
 * @param expirationDate The expiration date of the cache item.
 */
export function setToClientSessionCache(
  key: string,
  value: EncryptedValue,
  expirationDate: Date,
): void {
  const cache = getClientSessionCache();
  cache[key] = { value, lastAccessed: Date.now(), expirationDate };
  setClientSessionCache(cache);
}

/**
 * removeFromClientSessionCache function removes a cache item from the client-side session cache.
 * @param key The key of the cache item to remove.
 */
export function removeFromClientSessionCache(key: string): void {
  const cache = getClientSessionCache();
  delete cache[key];
  setClientSessionCache(cache);
}
