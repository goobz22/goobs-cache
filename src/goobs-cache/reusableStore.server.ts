/**
 * @file ReusableStore.server.ts
 * @description Implements server-side caching functionality with configuration loading and storage interface.
 */
'use server';

import fs from 'fs/promises';
import path from 'path';
import { ServerCache, createServerCache } from '../cache/serverless.server';
import { CacheConfig, DataValue, CacheMode, CacheResult } from '../types';

let serverCache: ServerCache | null = null;

/**
 * Loads the cache configuration from a JSON file.
 *
 * @returns {Promise<CacheConfig>} A promise that resolves to the cache configuration.
 * @throws {Error} If the configuration file cannot be loaded or parsed.
 */
export async function loadConfig(): Promise<CacheConfig> {
  const configPath = path.resolve(process.cwd(), '.reusablestore.json');
  try {
    const configFile = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(configFile) as CacheConfig;
  } catch (error) {
    console.error('Error loading config:', error);
    throw new Error('Failed to load configuration');
  }
}

/**
 * Initializes the server cache.
 *
 * @returns {Promise<ServerCache>} A promise that resolves to the initialized ServerCache instance.
 */
async function initializeServerCache(): Promise<ServerCache> {
  if (!serverCache) {
    const config = await loadConfig();
    const encryptionPassword = process.env.ENCRYPTION_PASSWORD || 'default-password';
    serverCache = await createServerCache(config, encryptionPassword);
  }
  return serverCache;
}

/**
 * Sets a value in the server-side cache.
 *
 * @param {string} identifier - The identifier for the cache item.
 * @param {string} storeName - The store name for the cache item.
 * @param {DataValue} value - The value to set.
 * @param {Date} expirationDate - The expiration date for the cached item.
 * @param {CacheMode} mode - The caching mode (always 'server' for server-side caching).
 * @returns {Promise<void>}
 */
export async function serverSet(
  identifier: string,
  storeName: string,
  value: DataValue,
  expirationDate: Date,
  mode: CacheMode,
): Promise<void> {
  if (mode !== 'server') {
    throw new Error(`Invalid cache mode for server-side caching: ${mode}`);
  }
  const cache = await initializeServerCache();
  await cache.set(identifier, storeName, value, expirationDate);
  // The ServerCache.set method should handle notifying real-time listeners internally
}

/**
 * Retrieves a value from the server-side cache.
 *
 * @param {string} identifier - The identifier for the cache item.
 * @param {string} storeName - The store name for the cache item.
 * @param {CacheMode} mode - The caching mode (always 'server' for server-side caching).
 * @returns {Promise<CacheResult>} A promise that resolves to the CacheResult containing the retrieved value and metadata.
 */
export async function serverGet(
  identifier: string,
  storeName: string,
  mode: CacheMode,
): Promise<CacheResult> {
  if (mode !== 'server') {
    throw new Error(`Invalid cache mode for server-side caching: ${mode}`);
  }
  const cache = await initializeServerCache();
  const result = await cache.get(identifier, storeName);
  if (result.value !== undefined) {
    return result;
  }
  // Return a default CacheResult if no value was found
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
 * Removes a value from the server-side cache.
 *
 * @param {string} identifier - The identifier for the cache item.
 * @param {string} storeName - The store name for the cache item.
 * @param {CacheMode} mode - The caching mode (always 'server' for server-side caching).
 * @returns {Promise<void>}
 */
export async function serverRemove(
  identifier: string,
  storeName: string,
  mode: CacheMode,
): Promise<void> {
  if (mode !== 'server') {
    throw new Error(`Invalid cache mode for server-side caching: ${mode}`);
  }
  const cache = await initializeServerCache();
  await cache.remove(identifier, storeName);
  // The ServerCache.remove method should handle notifying real-time listeners internally
}

/**
 * Subscribes to real-time updates for a specific cache item.
 *
 * @template T The type of the data being subscribed to.
 * @param {string} identifier - The identifier for the cache item.
 * @param {string} storeName - The store name for the cache item.
 * @param {(data: T) => void} listener - The callback function to be called when updates occur.
 * @returns {Promise<() => void>} A promise that resolves to a function to unsubscribe from updates.
 */
export async function subscribeToUpdates<T extends DataValue>(
  identifier: string,
  storeName: string,
  listener: (data: T) => void,
): Promise<() => void> {
  const cache = await initializeServerCache();
  return cache.subscribeToUpdates<T>(identifier, storeName, listener);
}
