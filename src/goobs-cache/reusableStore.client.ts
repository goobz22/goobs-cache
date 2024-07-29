/**
 * @file ReusableStore.client.ts
 * @description Implements client-side caching functionality using cookies and session storage.
 */
'use client';

import { DataValue, CacheConfig, CacheMode, CacheResult } from '../types';
import CookieCache from '../cache/cookie.client';
import SessionStorageCache from '../cache/session.client';
import config from '../../.reusablestore.json';

/**
 * Instantiate the CookieCache and SessionStorageCache with the imported config.
 */
const cookieCache = new CookieCache(config as CacheConfig);
const sessionStorageCache = new SessionStorageCache(config as CacheConfig);

/**
 * Sets a value in the client-side cache (either cookie or session storage).
 *
 * @param {string} identifier - The identifier for the cache item.
 * @param {string} storeName - The store name for the cache item.
 * @param {DataValue} value - The value to set.
 * @param {Date} expirationDate - The expiration date for the cached item.
 * @param {CacheMode} mode - The caching mode to use (client or cookie).
 */
export function clientSet(
  identifier: string,
  storeName: string,
  value: DataValue,
  expirationDate: Date,
  mode: CacheMode,
): void {
  if (mode === 'cookie') {
    cookieCache.set(identifier, storeName, value, expirationDate);
  } else if (mode === 'client') {
    sessionStorageCache.set(identifier, storeName, value, expirationDate);
  } else {
    throw new Error(`Invalid cache mode for client-side caching: ${mode}`);
  }
}

/**
 * Retrieves a value from the client-side cache (either cookie or session storage).
 *
 * @param {string} identifier - The identifier for the cache item.
 * @param {string} storeName - The store name for the cache item.
 * @param {CacheMode} mode - The caching mode to use (client or cookie).
 * @returns {Promise<CacheResult>} A promise that resolves to the CacheResult containing the retrieved value and metadata.
 */
export function clientGet(
  identifier: string,
  storeName: string,
  mode: CacheMode,
): Promise<CacheResult> {
  return new Promise((resolve) => {
    if (mode === 'cookie') {
      cookieCache.get(identifier, storeName, (result: CacheResult | undefined) => {
        resolve(result !== undefined ? result : createDefaultCacheResult(identifier, storeName));
      });
    } else if (mode === 'client') {
      sessionStorageCache.get(identifier, storeName, (result: CacheResult | undefined) => {
        resolve(result !== undefined ? result : createDefaultCacheResult(identifier, storeName));
      });
    } else {
      throw new Error(`Invalid cache mode for client-side caching: ${mode}`);
    }
  });
}

function createDefaultCacheResult(identifier: string, storeName: string): CacheResult {
  return {
    identifier,
    storeName,
    value: undefined,
    expirationDate: new Date(0),
    lastUpdatedDate: new Date(0),
    lastAccessedDate: new Date(0),
    getHitCount: 0,
    setHitCount: 0,
  };
}

/**
 * Removes a value from the client-side cache (either cookie or session storage).
 *
 * @param {string} identifier - The identifier for the cache item.
 * @param {string} storeName - The store name for the cache item.
 * @param {CacheMode} mode - The caching mode to use (client or cookie).
 */
export function clientRemove(identifier: string, storeName: string, mode: CacheMode): void {
  if (mode === 'cookie') {
    cookieCache.remove(identifier, storeName);
  } else if (mode === 'client') {
    sessionStorageCache.remove(identifier, storeName);
  } else {
    throw new Error(`Invalid cache mode for client-side caching: ${mode}`);
  }
}

/**
 * Subscribes to real-time updates for a specific cache item in session storage.
 * Note: This function only works with the 'client' mode (session storage).
 *
 * @template T The type of the data being subscribed to.
 * @param {string} identifier - The identifier for the cache item.
 * @param {string} storeName - The store name for the cache item.
 * @param {(data: T) => void} listener - The callback function to be called when updates occur.
 * @returns {() => void} A function to unsubscribe from updates.
 * @throws {Error} If the mode is not 'client'.
 */
export function subscribeToUpdates<T extends DataValue>(
  identifier: string,
  storeName: string,
  listener: (data: T | undefined) => void,
): () => void {
  return sessionStorageCache.subscribeToUpdates<T>(identifier, storeName, listener);
}
