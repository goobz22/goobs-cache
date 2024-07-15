/**
 * @file ReusableStore.server.ts
 * @description Implements server-side caching functionality with configuration loading and storage interface.
 */

'use server';

import fs from 'fs/promises';
import path from 'path';
import { ServerCache, createServerCache } from './cache/ServerCache';
import { CacheConfig, DataValue, CacheMode } from './types';

let serverCache: ServerCache | null = null;

/**
 * Loads the cache configuration from a JSON file.
 *
 * @returns {Promise<CacheConfig>} A promise that resolves to the cache configuration.
 * @throws {Error} If the configuration file cannot be loaded or parsed.
 */
async function loadConfig(): Promise<CacheConfig> {
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
    serverCache = await createServerCache(config);
  }
  return serverCache;
}

/**
 * Sets a value in the server-side cache.
 *
 * @template T
 * @param {string} identifier - The identifier for the cache item.
 * @param {string} storeName - The store name for the cache item.
 * @param {T} value - The value to set.
 * @param {Date} expirationDate - The expiration date for the cached item.
 * @param {CacheMode} mode - The caching mode (always 'server' for server-side caching).
 * @returns {Promise<void>}
 */
export async function serverSet<T extends DataValue>(
  identifier: string,
  storeName: string,
  value: T,
  expirationDate: Date,
  mode: CacheMode,
): Promise<void> {
  if (mode !== 'server') {
    throw new Error(`Invalid cache mode for server-side caching: ${mode}`);
  }
  const cache = await initializeServerCache();
  await cache.set(identifier, storeName, value, expirationDate);
}

/**
 * Retrieves a value from the server-side cache.
 *
 * @template T
 * @param {string} identifier - The identifier for the cache item.
 * @param {string} storeName - The store name for the cache item.
 * @param {CacheMode} mode - The caching mode (always 'server' for server-side caching).
 * @returns {Promise<T | null>} A promise that resolves to the retrieved value or null.
 */
export async function serverGet<T extends DataValue>(
  identifier: string,
  storeName: string,
  mode: CacheMode,
): Promise<T | null> {
  if (mode !== 'server') {
    throw new Error(`Invalid cache mode for server-side caching: ${mode}`);
  }
  const cache = await initializeServerCache();
  const value = await cache.get<T>(identifier, storeName);
  return value ?? null;
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
}

/**
 * Retrieves all values associated with a specific identifier and store name from the server-side cache.
 *
 * @template T
 * @param {string} identifier - The identifier to search for.
 * @param {string} storeName - The store name to search for.
 * @param {CacheMode} mode - The caching mode (always 'server' for server-side caching).
 * @returns {Promise<T[]>} A promise that resolves to an array of values associated with the identifier and store name.
 */
export async function serverGetByIdentifierAndStoreName<T extends DataValue>(
  identifier: string,
  storeName: string,
  mode: CacheMode,
): Promise<T[]> {
  if (mode !== 'server') {
    throw new Error(`Invalid cache mode for server-side caching: ${mode}`);
  }
  const cache = await initializeServerCache();
  return await cache.getByIdentifierAndStoreName<T>(identifier, storeName);
}

/**
 * Cleans up the server-side cache by clearing all items.
 *
 * @returns {Promise<void>}
 */
export async function cleanup(): Promise<void> {
  const cache = await initializeServerCache();
  await cache.clear();
}
