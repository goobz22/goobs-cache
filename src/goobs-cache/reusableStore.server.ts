/**
 * @file ReusableStore.server.ts
 * @description Implements server-side caching functionality with configuration loading and serverless storage interface.
 */
'use server';

import fs from 'fs/promises';
import path from 'path';
import { ServerlessCache, createServerlessCache } from '../cache/serverless.server';
import { CacheConfig, DataValue, CacheMode, CacheResult } from '../types';

let serverlessCache: ServerlessCache | null = null;

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
 * Initializes the serverless cache.
 *
 * @returns {Promise<ServerlessCache>} A promise that resolves to the initialized ServerlessCache instance.
 */
async function initializeServerlessCache(): Promise<ServerlessCache> {
  if (!serverlessCache) {
    const config = await loadConfig();
    const encryptionPassword = process.env.ENCRYPTION_PASSWORD || 'default-password';
    serverlessCache = await createServerlessCache(config, encryptionPassword);
  }
  return serverlessCache;
}

/**
 * Sets a value in the serverless cache.
 *
 * @param {string} identifier - The identifier for the cache item.
 * @param {string} storeName - The store name for the cache item.
 * @param {DataValue} value - The value to set.
 * @param {Date} expirationDate - The expiration date for the cached item.
 * @param {CacheMode} mode - The caching mode (always 'server' for serverless caching).
 * @returns {Promise<void>}
 */
export async function serverlessSet(
  identifier: string,
  storeName: string,
  value: DataValue,
  expirationDate: Date,
  mode: CacheMode,
): Promise<void> {
  if (mode !== 'server') {
    throw new Error(`Invalid cache mode for serverless caching: ${mode}`);
  }
  const cache = await initializeServerlessCache();
  await cache.set(identifier, storeName, value, expirationDate);
}

/**
 * Retrieves a value from the serverless cache.
 *
 * @param {string} identifier - The identifier for the cache item.
 * @param {string} storeName - The store name for the cache item.
 * @param {CacheMode} mode - The caching mode (always 'server' for serverless caching).
 * @returns {Promise<CacheResult>} A promise that resolves to the CacheResult containing the retrieved value and metadata.
 */
export async function serverlessGet(
  identifier: string,
  storeName: string,
  mode: CacheMode,
): Promise<CacheResult> {
  if (mode !== 'server') {
    throw new Error(`Invalid cache mode for serverless caching: ${mode}`);
  }
  const cache = await initializeServerlessCache();
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
 * Removes a value from the serverless cache.
 *
 * @param {string} identifier - The identifier for the cache item.
 * @param {string} storeName - The store name for the cache item.
 * @param {CacheMode} mode - The caching mode (always 'server' for serverless caching).
 * @returns {Promise<void>}
 */
export async function serverlessRemove(
  identifier: string,
  storeName: string,
  mode: CacheMode,
): Promise<void> {
  if (mode !== 'server') {
    throw new Error(`Invalid cache mode for serverless caching: ${mode}`);
  }
  const cache = await initializeServerlessCache();
  await cache.remove(identifier, storeName);
}
