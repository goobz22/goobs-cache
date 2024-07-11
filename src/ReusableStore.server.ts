/**
 * @file ReusableStore.server.ts
 * @description Implements server-side caching functionality with configuration loading and storage interface.
 */

'use server';

import fs from 'fs/promises';
import path from 'path';
import { ServerCache, createServerCache } from './cache/ServerCache';
import {
  EncryptedValue,
  CacheConfig,
  DataValue,
  StorageInterface,
  CacheItem,
  CacheStatistics,
} from './types';

/**
 * Represents an instance of the server-side store.
 * @interface
 */
interface StoreInstance {
  /** The server cache instance. */
  serverCache: ServerCache;
  /** The cache configuration. */
  config: CacheConfig;
}

/** Singleton instance of the server-side store. */
let storeInstance: StoreInstance | null = null;

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
    const userConfig = JSON.parse(configFile);
    return userConfig as CacheConfig;
  } catch (error) {
    console.error('Error loading config:', error);
    throw new Error('Failed to load configuration');
  }
}

/**
 * Gets or creates a store instance.
 *
 * @returns {Promise<StoreInstance>} A promise that resolves to the store instance.
 */
async function getOrCreateStoreInstance(): Promise<StoreInstance> {
  if (!storeInstance) {
    const config = await loadConfig();
    const storage: StorageInterface = {
      async get(key: string): Promise<CacheItem<EncryptedValue> | undefined> {
        // Implement your storage retrieval logic here
        return undefined;
      },
      async set(key: string, item: CacheItem<EncryptedValue>): Promise<void> {
        // Implement your storage set logic here
      },
      async remove(key: string): Promise<void> {
        // Implement your storage removal logic here
      },
      async clear(): Promise<void> {
        // Implement your storage clear logic here
      },
      async getStatistics(): Promise<CacheStatistics> {
        // Implement your storage statistics retrieval logic here
        return {
          hitRate: 0,
          missRate: 0,
          evictionCount: 0,
          totalItems: 0,
          memoryUsage: 0,
          averageAccessTime: 0,
          memorySize: 0,
        };
      },
      async setEvictionPolicy(policy: 'lru' | 'lfu' | 'adaptive'): Promise<void> {
        // Implement your eviction policy setting logic here
      },
      async autoTune(): Promise<void> {
        // Implement your auto-tuning logic here
      },
    };
    const serverCache = await createServerCache(storage, config);
    storeInstance = {
      serverCache,
      config,
    };
  }
  return storeInstance;
}

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
 * Sets a value in the server-side cache.
 *
 * @template T
 * @param {string} key - The key to set.
 * @param {T} value - The value to set.
 * @param {Date} expirationDate - The expiration date for the cached item.
 * @returns {Promise<void>}
 */
export async function serverSet<T extends DataValue>(
  key: string,
  value: T,
  expirationDate: Date,
): Promise<void> {
  const store = await getOrCreateStoreInstance();
  await store.serverCache.set(key, value, expirationDate);
}

/**
 * Retrieves a value from the server-side cache.
 *
 * @template T
 * @param {string} key - The key to retrieve.
 * @returns {Promise<{ value: T | null }>} A promise that resolves to an object containing the retrieved value or null.
 */
export async function serverGet<T extends DataValue>(key: string): Promise<{ value: T | null }> {
  const store = await getOrCreateStoreInstance();
  const value = await store.serverCache.get(key);
  if (value !== undefined) {
    return { value: value as T };
  }
  return { value: null };
}

/**
 * Removes a value from the server-side cache.
 *
 * @param {string} key - The key to remove.
 * @returns {Promise<void>}
 */
export async function serverRemove(key: string): Promise<void> {
  const store = await getOrCreateStoreInstance();
  await store.serverCache.remove(key);
}

/**
 * Cleans up the server-side cache by clearing all items and resetting the store instance.
 *
 * @returns {Promise<void>}
 */
export async function cleanup(): Promise<void> {
  const store = await getOrCreateStoreInstance();
  if (store) {
    await store.serverCache.clear();
    storeInstance = null;
  }
}
