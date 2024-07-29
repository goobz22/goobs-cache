/**
 * @file ReusableStore.ts
 * @description Provides the main interface for the ReusableStore, handling both server-side and client-side caching operations.
 */
import { DataValue, CacheMode, CacheResult, CacheConfig } from '../types';
import { TwoLayerCache } from '../cache/twoLayerServerlessAndSession';

/** Determines if the code is running on the server or client side. */
const isServer = typeof window === 'undefined';

// Create a singleton instance of TwoLayerCache
const twoLayerCache = new TwoLayerCache({
  cacheSize: 1000,
  cacheMaxAge: 24 * 60 * 60 * 1000, // 24 hours
  // Add other necessary config options
} as CacheConfig);

/**
 * Sets a value in the cache.
 *
 * @param {string} identifier - The identifier for the cache item.
 * @param {string} storeName - The store name for the cache item.
 * @param {DataValue} value - The value to set.
 * @param {CacheMode} mode - The caching mode to use.
 * @param {Date} [expirationDate] - Optional expiration date for the cached item.
 * @returns {Promise<void>} A promise that resolves when the set operation is complete.
 */
export function set(
  identifier: string,
  storeName: string,
  value: DataValue,
  mode: CacheMode,
  expirationDate: Date = new Date(Date.now() + 24 * 60 * 60 * 1000),
): Promise<void> {
  if (mode === 'twoLayer') {
    return twoLayerCache.set(identifier, storeName, value, expirationDate);
  }

  if (isServer) {
    if (mode === 'server') {
      return import('./reusableStore.server').then(({ serverSet }) =>
        serverSet(identifier, storeName, value, expirationDate, mode),
      );
    }
  } else {
    if (mode === 'client' || mode === 'cookie') {
      return import('./reusableStore.client').then(({ clientSet }) =>
        clientSet(identifier, storeName, value, expirationDate, mode),
      );
    }
  }
  return Promise.resolve();
}

/**
 * Retrieves a value from the cache.
 *
 * @param {string} identifier - The identifier for the cache item.
 * @param {string} storeName - The store name for the cache item.
 * @param {CacheMode} mode - The caching mode to use.
 * @returns {Promise<CacheResult>} A promise that resolves to the CacheResult containing the value and metadata.
 */
export function get(identifier: string, storeName: string, mode: CacheMode): Promise<CacheResult> {
  if (mode === 'twoLayer') {
    return twoLayerCache.get(identifier, storeName);
  }

  if (isServer) {
    if (mode === 'server') {
      return import('./reusableStore.server').then(({ serverGet }) =>
        serverGet(identifier, storeName, mode),
      );
    }
  } else {
    if (mode === 'client' || mode === 'cookie') {
      return import('./reusableStore.client').then(({ clientGet }) =>
        clientGet(identifier, storeName, mode),
      );
    }
  }
  // Default case: return an empty result
  return Promise.resolve({
    identifier,
    storeName,
    value: undefined,
    expirationDate: new Date(0),
    lastUpdatedDate: new Date(0),
    lastAccessedDate: new Date(0),
    getHitCount: 0,
    setHitCount: 0,
  });
}

/**
 * Removes a value from the cache.
 *
 * @param {string} identifier - The identifier for the cache item.
 * @param {string} storeName - The store name for the cache item.
 * @param {CacheMode} mode - The caching mode to use.
 * @returns {Promise<void>} A promise that resolves when the remove operation is complete.
 */
export function remove(identifier: string, storeName: string, mode: CacheMode): Promise<void> {
  if (mode === 'twoLayer') {
    return twoLayerCache.remove(identifier, storeName);
  }

  if (isServer) {
    if (mode === 'server') {
      return import('./reusableStore.server').then(({ serverRemove }) =>
        serverRemove(identifier, storeName, mode),
      );
    }
  } else {
    if (mode === 'client' || mode === 'cookie') {
      return import('./reusableStore.client').then(({ clientRemove }) =>
        clientRemove(identifier, storeName, mode),
      );
    }
  }
  return Promise.resolve();
}

/**
 * Subscribes to real-time updates for a specific cache item.
 *
 * @template T The type of the data being subscribed to.
 * @param {string} identifier - The identifier for the cache item.
 * @param {string} storeName - The store name for the cache item.
 * @param {(data: T | undefined) => void} listener - The callback function to be called when updates occur.
 * @param {CacheMode} mode - The caching mode to use.
 * @returns {Promise<() => void>} A promise that resolves to a function to unsubscribe from updates.
 */
export function subscribeToUpdates<T extends DataValue>(
  identifier: string,
  storeName: string,
  listener: (data: T | undefined) => void,
  mode: CacheMode,
): Promise<() => void> {
  if (mode === 'twoLayer') {
    return Promise.resolve(
      twoLayerCache.subscribeToUpdates(identifier, storeName, (data: DataValue | undefined) =>
        listener(data as T | undefined),
      ),
    );
  }

  if (isServer) {
    if (mode === 'server') {
      return import('./reusableStore.server').then(({ subscribeToUpdates: serverSubscribe }) =>
        serverSubscribe<T>(identifier, storeName, (data: T | undefined) => listener(data)),
      );
    }
  } else {
    if (mode === 'client') {
      return import('./reusableStore.client').then(({ subscribeToUpdates: clientSubscribe }) =>
        clientSubscribe<T>(identifier, storeName, (data: T | undefined) => listener(data)),
      );
    }
  }
  return Promise.resolve(() => {});
}
