/**
 * @file ReusableStore.ts
 * @description Provides the main interface for the ReusableStore, handling both server-side and client-side caching operations with automatic two-layer synchronization.
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
export async function set(
  identifier: string,
  storeName: string,
  value: DataValue,
  mode: CacheMode,
  expirationDate: Date = new Date(Date.now() + 24 * 60 * 60 * 1000),
): Promise<void> {
  if (mode === 'twoLayer' || mode === 'server') {
    await twoLayerCache.set(identifier, storeName, value, expirationDate);
  } else if (!isServer && (mode === 'client' || mode === 'cookie')) {
    const { clientSet } = await import('./reusableStore.client');
    await clientSet(identifier, storeName, value, expirationDate, mode);
  }
}

/**
 * Retrieves a value from the cache.
 *
 * @param {string} identifier - The identifier for the cache item.
 * @param {string} storeName - The store name for the cache item.
 * @param {CacheMode} mode - The caching mode to use.
 * @returns {Promise<CacheResult>} A promise that resolves to the CacheResult containing the value and metadata.
 */
export async function get(
  identifier: string,
  storeName: string,
  mode: CacheMode,
): Promise<CacheResult> {
  if (mode === 'twoLayer') {
    return twoLayerCache.get(identifier, storeName);
  } else if (mode === 'server') {
    if (isServer) {
      const { serverlessGet } = await import('./reusableStore.server');
      return serverlessGet(identifier, storeName, mode);
    } else {
      // When on client-side, first try to get from session storage
      const { clientGet } = await import('./reusableStore.client');
      const clientResult = await clientGet(identifier, storeName, 'client');
      if (clientResult.value !== undefined) {
        return clientResult;
      }
      // If not in session storage, fetch from serverless and update session storage
      const serverResult = await twoLayerCache.get(identifier, storeName);
      if (serverResult.value !== undefined) {
        await set(identifier, storeName, serverResult.value, 'client', serverResult.expirationDate);
      }
      return serverResult;
    }
  } else if (!isServer && (mode === 'client' || mode === 'cookie')) {
    const { clientGet } = await import('./reusableStore.client');
    return clientGet(identifier, storeName, mode);
  }

  // Default case: return an empty result
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
 * Removes a value from the cache.
 *
 * @param {string} identifier - The identifier for the cache item.
 * @param {string} storeName - The store name for the cache item.
 * @param {CacheMode} mode - The caching mode to use.
 * @returns {Promise<void>} A promise that resolves when the remove operation is complete.
 */
export async function remove(
  identifier: string,
  storeName: string,
  mode: CacheMode,
): Promise<void> {
  if (mode === 'twoLayer' || mode === 'server') {
    await twoLayerCache.remove(identifier, storeName);
    if (!isServer && mode === 'twoLayer') {
      const { clientRemove } = await import('./reusableStore.client');
      await clientRemove(identifier, storeName, 'client');
    }
  } else if (!isServer && (mode === 'client' || mode === 'cookie')) {
    const { clientRemove } = await import('./reusableStore.client');
    await clientRemove(identifier, storeName, mode);
  }
}
