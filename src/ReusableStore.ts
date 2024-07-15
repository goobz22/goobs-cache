/**
 * @file ReusableStore.ts
 * @description Provides the main interface for the ReusableStore, handling both server-side and client-side caching operations.
 */
import {
  DataValue,
  StringValue,
  ListValue,
  SetValue,
  HashValue,
  StreamValue,
  ZSetValue,
  HLLValue,
  GeoValue,
  JSONValue,
  CacheMode,
} from './types';
import { getExpirationDate } from './utils/ExpirationDate';

/** Determines if the code is running on the server or client side. */
const isServer = typeof window === 'undefined';

/**
 * Sets a value in the cache.
 *
 * @template T
 * @param {string} identifier - The identifier for the cache item.
 * @param {string} storeName - The store name for the cache item.
 * @param {T} value - The value to set.
 * @param {CacheMode} mode - The caching mode to use, which also determines the expiration style.
 * @returns {Promise<void>} A promise that resolves when the set operation is complete.
 */
export function set<
  T extends
    | DataValue
    | StringValue
    | ListValue
    | SetValue
    | HashValue
    | StreamValue
    | ZSetValue
    | HLLValue
    | GeoValue
    | JSONValue,
>(identifier: string, storeName: string, value: T, mode: CacheMode): Promise<void> {
  const expirationDate = getExpirationDate(mode);
  if (isServer) {
    if (mode === 'server') {
      return import('./ReusableStore.server').then(({ serverSet }) =>
        serverSet(identifier, storeName, value, expirationDate, mode),
      );
    }
  } else {
    if (mode === 'client' || mode === 'cookie') {
      return import('./ReusableStore.client').then(({ clientSet }) =>
        clientSet(identifier, value, expirationDate, mode, storeName),
      );
    }
  }
  return Promise.resolve();
}

/**
 * Retrieves a value or values from the cache.
 *
 * @template T
 * @param {string} identifier - The identifier for the cache item.
 * @param {string} storeName - The store name for the cache item.
 * @param {CacheMode} mode - The caching mode to use.
 * @returns {Promise<T | T[] | null>} A promise that resolves to the retrieved value, array of values, or null.
 */
export function get<
  T extends
    | DataValue
    | StringValue
    | ListValue
    | SetValue
    | HashValue
    | StreamValue
    | ZSetValue
    | HLLValue
    | GeoValue
    | JSONValue,
>(identifier: string, storeName: string, mode: CacheMode): Promise<T | T[] | null> {
  if (isServer) {
    if (mode === 'server') {
      return import('./ReusableStore.server').then(({ serverGet }) =>
        serverGet<T>(identifier, storeName, mode),
      );
    }
  } else {
    if (mode === 'client' || mode === 'cookie') {
      return import('./ReusableStore.client').then(({ clientGet }) =>
        clientGet<T>(identifier, mode, storeName),
      );
    }
  }
  return Promise.resolve(null);
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
  if (isServer) {
    if (mode === 'server') {
      return import('./ReusableStore.server').then(({ serverRemove }) =>
        serverRemove(identifier, storeName, mode),
      );
    }
  } else {
    if (mode === 'client' || mode === 'cookie') {
      return import('./ReusableStore.client').then(({ clientRemove }) =>
        clientRemove(identifier, mode, storeName),
      );
    }
  }
  return Promise.resolve();
}

/**
 * Cleans up the cache, clearing all items.
 * This function only has an effect on the server-side cache.
 *
 * @returns {Promise<void>} A promise that resolves when the cleanup is complete.
 */
export function cleanup(): Promise<void> {
  if (isServer) {
    return import('./ReusableStore.server').then(({ cleanup }) => cleanup());
  }
  return Promise.resolve();
}
