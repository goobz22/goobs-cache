/**
 * @file ReusableStore.client.ts
 * @description Implements client-side caching functionality using cookies and session storage.
 */

'use client';

import { DataValue, CacheConfig, CacheMode } from './types';
import CookieCache from './cache/Cookie';
import SessionStorageCache from './cache/SessionStorage';
import config from './../.reusablestore.json';

/**
 * Instantiate the CookieCache and SessionStorageCache with the imported config.
 */
const cookieCache = new CookieCache(config as CacheConfig);
const sessionStorageCache = new SessionStorageCache(config as CacheConfig);

/**
 * Sets a value in the client-side cache (either cookie or session storage).
 *
 * @template T
 * @param {string} identifier - The identifier for the cache item.
 * @param {T} value - The value to set.
 * @param {Date} expirationDate - The expiration date for the cached item.
 * @param {CacheMode} mode - The caching mode to use (client or cookie).
 * @param {string} storeName - The store name for the cache item.
 * @returns {Promise<void>}
 */
export async function clientSet<T extends DataValue>(
  identifier: string,
  value: T,
  expirationDate: Date,
  mode: CacheMode,
  storeName: string,
): Promise<void> {
  if (mode === 'cookie') {
    await cookieCache.setToCookie(identifier, storeName, value, expirationDate);
  } else if (mode === 'client') {
    await sessionStorageCache.setToSessionStorage(identifier, storeName, value, expirationDate);
  } else {
    throw new Error(`Invalid cache mode for client-side caching: ${mode}`);
  }
}

/**
 * Retrieves a value from the client-side cache (either cookie or session storage).
 *
 * @template T
 * @param {string} identifier - The identifier for the cache item.
 * @param {CacheMode} mode - The caching mode to use (client or cookie).
 * @param {string} storeName - The store name for the cache item.
 * @returns {Promise<T | null>} A promise that resolves to the retrieved value or null.
 */
export async function clientGet<T extends DataValue>(
  identifier: string,
  mode: CacheMode,
  storeName: string,
): Promise<T | null> {
  let clientCachedItems: T[] | undefined;
  if (mode === 'cookie') {
    clientCachedItems = await cookieCache.getFromCookie<T>(identifier, storeName);
  } else if (mode === 'client') {
    clientCachedItems = await sessionStorageCache.getFromSessionStorage<T>(identifier, storeName);
  } else {
    throw new Error(`Invalid cache mode for client-side caching: ${mode}`);
  }

  if (clientCachedItems && clientCachedItems.length > 0) {
    return clientCachedItems[clientCachedItems.length - 1];
  }
  return null;
}

/**
 * Removes a value from the client-side cache (either cookie or session storage).
 *
 * @param {string} identifier - The identifier for the cache item.
 * @param {CacheMode} mode - The caching mode to use (client or cookie).
 * @param {string} storeName - The store name for the cache item.
 * @returns {Promise<void>}
 */
export async function clientRemove(
  identifier: string,
  mode: CacheMode,
  storeName: string,
): Promise<void> {
  if (mode === 'cookie') {
    cookieCache.removeFromCookie(identifier, storeName);
  } else if (mode === 'client') {
    sessionStorageCache.removeFromSessionStorage(identifier, storeName);
  } else {
    throw new Error(`Invalid cache mode for client-side caching: ${mode}`);
  }
}

/**
 * Creates a client-side atom for a specific identifier and storeName in the cache.
 *
 * @template T
 * @param {string} identifier - The identifier for the atom.
 * @param {string} storeName - The store name for the atom.
 * @param {T} initialValue - The initial value for the atom.
 * @param {CacheMode} mode - The caching mode to use (client or cookie).
 * @returns {ReturnType<CookieCache['createAtom']> | ReturnType<SessionStorageCache['createAtom']>} The created atom.
 */
export function createClientAtom<T extends DataValue>(
  identifier: string,
  storeName: string,
  initialValue: T,
  mode: CacheMode,
) {
  const cache = mode === 'cookie' ? cookieCache : sessionStorageCache;
  return cache.createAtom(identifier, storeName, initialValue);
}

/**
 * Uses a client-side context for a specific identifier and storeName in the cache.
 *
 * @template T
 * @param {string} identifier - The identifier for the context.
 * @param {string} storeName - The store name for the context.
 * @param {CacheMode} mode - The caching mode to use (client or cookie).
 * @returns {Promise<T | undefined>} A promise that resolves to the context value or undefined.
 */
export function useClientContext<T extends DataValue>(
  identifier: string,
  storeName: string,
  mode: CacheMode,
): () => Promise<T | undefined> {
  const cache = mode === 'cookie' ? cookieCache : sessionStorageCache;
  return cache.useContextHook(identifier, storeName);
}

/**
 * Creates a client-side context for a specific identifier and storeName in the cache.
 *
 * @template T
 * @param {string} identifier - The identifier for the context.
 * @param {string} storeName - The store name for the context.
 * @param {T} defaultValue - The default value for the context.
 * @param {CacheMode} mode - The caching mode to use (client or cookie).
 * @returns {ReturnType<CookieCache['createContext']> | ReturnType<SessionStorageCache['createContext']>} The created context.
 */
export function createClientContext<T extends DataValue>(
  identifier: string,
  storeName: string,
  defaultValue: T,
  mode: CacheMode,
) {
  const cache = mode === 'cookie' ? cookieCache : sessionStorageCache;
  return cache.createContext(identifier, storeName, defaultValue);
}

/**
 * Creates a client-side useState-like hook for a specific identifier and storeName in the cache.
 *
 * @template T
 * @param {string} identifier - The identifier for the state.
 * @param {string} storeName - The store name for the state.
 * @param {T} initialValue - The initial value for the state.
 * @param {CacheMode} mode - The caching mode to use (client or cookie).
 * @returns {ReturnType<CookieCache['useState']> | ReturnType<SessionStorageCache['useState']>} A useState-like hook for the cached value.
 */
export function useClientState<T extends DataValue>(
  identifier: string,
  storeName: string,
  initialValue: T,
  mode: CacheMode,
): () => [T | undefined, (value: T | ((prev: T) => Promise<T>)) => void] {
  const cache = mode === 'cookie' ? cookieCache : sessionStorageCache;
  return cache.useStateHook(identifier, storeName, initialValue);
}

/**
 * Retrieves all values associated with a specific identifier and store name from the client-side cache (either cookie or session storage).
 *
 * @template T
 * @param {string} identifier - The identifier to search for.
 * @param {string} storeName - The store name to search for.
 * @param {CacheMode} mode - The caching mode to use (client or cookie).
 * @returns {Promise<T[]>} A promise that resolves to an array of values associated with the identifier and store name.
 */
export async function clientGetByIdentifierAndStoreName<T extends DataValue>(
  identifier: string,
  storeName: string,
  mode: CacheMode,
): Promise<T[]> {
  const cache = mode === 'cookie' ? cookieCache : sessionStorageCache;
  return cache.getByIdentifierAndStoreName<T>(identifier, storeName);
}
