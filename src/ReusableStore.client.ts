/**
 * @file ReusableStore.client.ts
 * @description Implements client-side caching functionality using cookies and session storage.
 */

'use client';

import { DataValue, EncryptedValue, CacheConfig } from './types';
import CookieCache from './cache/Cookie';
import SessionStorageCache from './cache/SessionStorage';
import config from '../.reusablestore.json';

/**
 * Instantiate the CookieCache and SessionStorageCache with the imported config.
 */
const cookieCache = new CookieCache(config as CacheConfig);
const sessionStorageCache = new SessionStorageCache(config as CacheConfig);

/**
 * Determines the type of a given value.
 *
 * @param {DataValue} value - The value to check.
 * @returns {string} The type of the value as a string.
 */
function getValueType(value: DataValue): string {
  if (Array.isArray(value)) {
    return 'array';
  } else if (typeof value === 'object' && value !== null) {
    if ('type' in value && typeof value.type === 'string') {
      return value.type;
    }
    return 'object';
  }
  return typeof value;
}

/**
 * Sets a value in the client-side cache (either cookie or session storage).
 *
 * @template T
 * @param {string} key - The key to set.
 * @param {T} value - The value to set.
 * @param {Date} expirationDate - The expiration date for the cached item.
 * @param {'cookie' | 'session'} cacheType - The type of cache to use (cookie or session storage).
 * @returns {Promise<void>}
 */
export async function clientSet<T extends DataValue>(
  key: string,
  value: T,
  expirationDate: Date,
  cacheType: 'cookie' | 'session',
): Promise<void> {
  const stringifiedValue = JSON.stringify(value);
  const encryptedValue: EncryptedValue = {
    encryptedData: stringifiedValue,
    iv: '',
    salt: '',
    encryptionKey: '',
    type: getValueType(value),
  };

  if (cacheType === 'cookie') {
    cookieCache.setToCookie(key, encryptedValue, expirationDate);
  } else {
    sessionStorageCache.setToSessionStorage(key, encryptedValue, expirationDate);
  }
}

/**
 * Retrieves a value from the client-side cache (either cookie or session storage).
 *
 * @template T
 * @param {string} key - The key to retrieve.
 * @param {'cookie' | 'session'} cacheType - The type of cache to use (cookie or session storage).
 * @returns {Promise<{ value: T | null }>} A promise that resolves to an object containing the retrieved value or null.
 */
export async function clientGet<T extends DataValue>(
  key: string,
  cacheType: 'cookie' | 'session',
): Promise<{ value: T | null }> {
  let clientCachedItem;
  if (cacheType === 'cookie') {
    clientCachedItem = await cookieCache.getFromCookie(key);
  } else {
    clientCachedItem = await sessionStorageCache.getFromSessionStorage(key);
  }

  if (
    clientCachedItem &&
    typeof clientCachedItem === 'object' &&
    'encryptedData' in clientCachedItem
  ) {
    try {
      const parsedValue = JSON.parse(clientCachedItem.encryptedData) as T;
      return { value: parsedValue };
    } catch (parseError) {
      console.error('Error parsing cached item:', parseError);
      return { value: null };
    }
  }
  return { value: null };
}

/**
 * Removes a value from the client-side cache (either cookie or session storage).
 *
 * @param {string} key - The key to remove.
 * @param {'cookie' | 'session'} cacheType - The type of cache to use (cookie or session storage).
 */
export function clientRemove(key: string, cacheType: 'cookie' | 'session'): void {
  if (cacheType === 'cookie') {
    cookieCache.removeFromCookie(key);
  } else {
    sessionStorageCache.removeFromSessionStorage(key);
  }
}

/**
 * Creates a client-side atom for a specific key in the cache.
 *
 * @template T
 * @param {string} key - The key for the atom.
 * @param {T} initialValue - The initial value for the atom.
 * @param {'cookie' | 'session'} cacheType - The type of cache to use (cookie or session storage).
 * @returns {ReturnType<CookieCache['createAtom']> | ReturnType<SessionStorageCache['createAtom']>} The created atom.
 */
export function createClientAtom<T extends DataValue>(
  key: string,
  initialValue: T,
  cacheType: 'cookie' | 'session',
) {
  const cache = cacheType === 'cookie' ? cookieCache : sessionStorageCache;
  return cache.createAtom(key, initialValue);
}

/**
 * Uses a client-side context for a specific key in the cache.
 *
 * @template T
 * @param {string} key - The key for the context.
 * @param {T} defaultValue - The default value for the context.
 * @param {'cookie' | 'session'} cacheType - The type of cache to use (cookie or session storage).
 * @returns {Promise<T>} A promise that resolves to the context value.
 */
export function useClientContext<T extends DataValue>(
  key: string,
  defaultValue: T,
  cacheType: 'cookie' | 'session',
): Promise<T> {
  const cache = cacheType === 'cookie' ? cookieCache : sessionStorageCache;
  return cache.useContext(key) as Promise<T>;
}

/**
 * Creates a client-side context for a specific key in the cache.
 *
 * @template T
 * @param {string} key - The key for the context.
 * @param {T} defaultValue - The default value for the context.
 * @param {'cookie' | 'session'} cacheType - The type of cache to use (cookie or session storage).
 * @returns {ReturnType<CookieCache['createContext']> | ReturnType<SessionStorageCache['createContext']>} The created context.
 */
export function createClientContext<T extends DataValue>(
  key: string,
  defaultValue: T,
  cacheType: 'cookie' | 'session',
) {
  const cache = cacheType === 'cookie' ? cookieCache : sessionStorageCache;
  return cache.createContext(key, defaultValue);
}

/**
 * Creates a client-side useState-like hook for a specific key in the cache.
 *
 * @template T
 * @param {string} key - The key for the state.
 * @param {T} initialValue - The initial value for the state.
 * @param {'cookie' | 'session'} cacheType - The type of cache to use (cookie or session storage).
 * @returns {ReturnType<CookieCache['useState']> | ReturnType<SessionStorageCache['useState']>} A useState-like hook for the cached value.
 */
export function useClientState<T extends DataValue>(
  key: string,
  initialValue: T,
  cacheType: 'cookie' | 'session',
) {
  const cache = cacheType === 'cookie' ? cookieCache : sessionStorageCache;
  return cache.useState(key, initialValue);
}
