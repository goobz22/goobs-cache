/**
 * @file ReusableStore.ts
 * @description Provides the main interface for the ReusableStore, handling both server-side and client-side caching operations.
 */

import { DataValue } from './types';

/** Determines if the code is running on the server or client side. */
const isServer = typeof window === 'undefined';

/**
 * Sets a value in the cache.
 *
 * @template T
 * @param {string} key - The key to set.
 * @param {T} value - The value to set.
 * @param {Date} expirationDate - The expiration date for the cached item.
 * @param {'server' | 'client' | 'cookie'} mode - The caching mode to use.
 * @returns {void | Promise<void>} Void if synchronous, Promise<void> if asynchronous.
 */
export function set<T extends DataValue>(
  key: string,
  value: T,
  expirationDate: Date,
  mode: 'server' | 'client' | 'cookie',
): void | Promise<void> {
  if (isServer) {
    if (mode === 'server') {
      return import('./ReusableStore.server').then(({ serverSet }) =>
        serverSet(key, value, expirationDate),
      );
    }
  } else {
    if (mode === 'client') {
      return import('./ReusableStore.client').then(({ clientSet }) =>
        clientSet(key, value, expirationDate, 'session'),
      );
    } else if (mode === 'cookie') {
      return import('./ReusableStore.client').then(({ clientSet }) =>
        clientSet(key, value, expirationDate, 'cookie'),
      );
    }
  }
}

/**
 * Retrieves a value from the cache.
 *
 * @template T
 * @param {string} key - The key to retrieve.
 * @param {'server' | 'client' | 'cookie'} mode - The caching mode to use.
 * @returns {{ value: T | null } | Promise<{ value: T | null }>} The retrieved value or null, either synchronously or as a Promise.
 */
export function get<T extends DataValue>(
  key: string,
  mode: 'server' | 'client' | 'cookie',
): { value: T | null } | Promise<{ value: T | null }> {
  if (isServer) {
    if (mode === 'server') {
      return import('./ReusableStore.server').then(({ serverGet }) => serverGet<T>(key));
    }
  } else {
    if (mode === 'client') {
      return import('./ReusableStore.client').then(({ clientGet }) => clientGet<T>(key, 'session'));
    } else if (mode === 'cookie') {
      return import('./ReusableStore.client').then(({ clientGet }) => clientGet<T>(key, 'cookie'));
    }
  }
  return { value: null };
}

/**
 * Removes a value from the cache.
 *
 * @param {string} key - The key to remove.
 * @param {'server' | 'client' | 'cookie'} mode - The caching mode to use.
 * @returns {void | Promise<void>} Void if synchronous, Promise<void> if asynchronous.
 */
export function remove(key: string, mode: 'server' | 'client' | 'cookie'): void | Promise<void> {
  if (isServer) {
    if (mode === 'server') {
      return import('./ReusableStore.server').then(({ serverRemove }) => serverRemove(key));
    }
  } else {
    if (mode === 'client') {
      return import('./ReusableStore.client').then(({ clientRemove }) =>
        clientRemove(key, 'session'),
      );
    } else if (mode === 'cookie') {
      return import('./ReusableStore.client').then(({ clientRemove }) =>
        clientRemove(key, 'cookie'),
      );
    }
  }
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
