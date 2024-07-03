'use server';

import fs from 'fs/promises';
import path from 'path';
import {
  createTwoLevelCache,
  getFromTwoLevelCache,
  setToTwoLevelCache,
  removeFromTwoLevelCache,
  TwoLevelCacheImplementation,
} from './cache/TwoLevelServerCache';
import {
  createMemoryCache,
  getFromMemoryCache,
  setToMemoryCache,
  deleteFromMemoryCache,
  MemoryCacheImplementation,
  createMemoryStorage,
} from './cache/MemoryCache';
import { encrypt, decrypt } from './utils/Encryption';
import { compressData, decompressData } from './utils/Compression';
import {
  createAccessTracker,
  recordAccess,
  AccessTrackerImplementation,
} from './utils/AccessTracker';
import {
  createPrefetcher,
  prefetchFrequentItems,
  PrefetcherImplementation,
} from './utils/Prefetcher';
import {
  createBatchWriter,
  addToBatch,
  stopBatchWriter,
  BatchWriterImplementation,
} from './utils/BatchWriter';
import { EncryptedValue, CacheConfig, DataValue, StorageInterface, EvictionPolicy } from './types';
import ClientSessionCache from './cache/ClientSessionCache';

/**
 * StoreInstance interface represents the core components of the storage system.
 * It includes the server cache, memory cache, storage, access tracker, prefetcher, and batch writer.
 */
interface StoreInstance {
  serverCache: TwoLevelCacheImplementation;
  memoryCache: MemoryCacheImplementation<EncryptedValue>;
  storage: StorageInterface;
  accessTracker: AccessTrackerImplementation;
  prefetcher: PrefetcherImplementation;
  batchWriter: BatchWriterImplementation;
  config: CacheConfig;
}

// Global variable to hold the singleton instance of StoreInstance
let storeInstance: StoreInstance | null = null;

/**
 * Loads the configuration from the .reusablestore.json file.
 * If the file is not found or fails to load, it falls back to the default configuration.
 * @returns A Promise that resolves to the CacheConfig object.
 */
async function loadConfig(): Promise<CacheConfig> {
  const defaultConfig: CacheConfig = {
    algorithm: 'aes-256-gcm',
    keyCheckIntervalMs: 86400000,
    keyRotationIntervalMs: 7776000000,
    compressionLevel: -1,
    cacheSize: 10000,
    cacheMaxAge: 86400000,
    persistenceInterval: 600000,
    maxMemoryUsage: 1073741824,
    evictionPolicy: 'lru' as EvictionPolicy,
    forceReset: false,
    prefetchThreshold: 5,
    batchSize: 100,
    autoTuneInterval: 3600000,
    keySize: 256,
  };

  const configPath = path.resolve(process.cwd(), '.reusablestore.json');

  try {
    const configFile = await fs.readFile(configPath, 'utf-8');
    const userConfig = JSON.parse(configFile);
    return { ...defaultConfig, ...userConfig };
  } catch (error) {
    return defaultConfig;
  }
}

/**
 * getOrCreateStoreInstance function creates a new StoreInstance if one doesn't exist,
 * or returns the existing instance if it has already been created.
 * This implements the singleton pattern for the store instance.
 * It initializes the server cache, memory cache, access tracker, prefetcher, and batch writer.
 * It also sets up periodic prefetching of frequently accessed items.
 * @returns A Promise that resolves to the StoreInstance.
 */
async function getOrCreateStoreInstance(): Promise<StoreInstance> {
  if (!storeInstance) {
    const config = await loadConfig();
    const storage = await createMemoryStorage(config);

    const serverCache = await createTwoLevelCache(storage, config);
    const memoryCache = await createMemoryCache<EncryptedValue>(config);
    const accessTracker = await createAccessTracker();
    const prefetcher = await createPrefetcher(serverCache, accessTracker, config);
    const batchWriter = await createBatchWriter(
      storage,
      config.batchSize,
      config.persistenceInterval,
    );

    storeInstance = {
      serverCache,
      memoryCache,
      storage,
      accessTracker,
      prefetcher,
      batchWriter,
      config,
    };

    // Set up periodic prefetching of frequently accessed items
    setInterval(() => prefetchFrequentItems(prefetcher), config.persistenceInterval);
  }

  return storeInstance;
}

/**
 * set function stores a value in the cache and adds it to the batch writer for persistence.
 * It handles compression, encryption, and different storage modes (server, client, or memory).
 * @param key The key under which to store the value.
 * @param value The value to store.
 * @param expirationDate The date when this value should expire.
 * @param mode The storage mode: 'server', 'client', or 'memory'.
 */
export async function set<T extends DataValue>(
  key: string,
  value: T,
  expirationDate: Date,
  mode: 'server' | 'client' | 'memory',
): Promise<void> {
  const stringifiedValue = JSON.stringify(value);

  const store = await getOrCreateStoreInstance();

  // Compress the stringified value
  let compressedValue: Buffer;
  try {
    compressedValue = await compressData(stringifiedValue);
  } catch (error) {
    compressedValue = Buffer.from(stringifiedValue);
  }

  // Encrypt the compressed value
  const { encryptedData, iv, authTag, encryptionKey } = await encrypt(
    compressedValue.toString('base64'),
    store.config,
  );

  /**
   * getValueType function determines the type of the value for storing in the encrypted value object.
   * It checks for specific types like array, object, and primitive types.
   * @param value The value to determine the type of.
   * @returns A string representing the type of the value.
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

  const encryptedValue: EncryptedValue = {
    encryptedData,
    iv,
    authTag: authTag || '',
    encryptionKey,
    type: getValueType(value),
  };

  if (mode === 'server') {
    await setToTwoLevelCache(store.serverCache, key, encryptedValue, expirationDate);
    await addToBatch(store.batchWriter, key, encryptedValue, expirationDate);
    await recordAccess(key);
  } else if (mode === 'client') {
    ClientSessionCache.setToClientSessionCache(key, encryptedValue, expirationDate);
  } else if (mode === 'memory') {
    await setToMemoryCache(store.memoryCache, key, encryptedValue, expirationDate);
  }
}

/**
 * get function retrieves a value from the cache, handles decryption and decompression,
 * and supports different storage modes (server, client, or memory).
 * @param key The key of the value to retrieve.
 * @param mode The storage mode: 'server', 'client', or 'memory'.
 * @returns A Promise that resolves to an object containing the retrieved value, or null if not found.
 */
export async function get<T extends DataValue>(
  key: string,
  mode: 'server' | 'client' | 'memory',
): Promise<{ value: T | null }> {
  let cachedItem: EncryptedValue | undefined;

  const store = await getOrCreateStoreInstance();

  if (mode === 'server') {
    cachedItem = await getFromTwoLevelCache(store.serverCache, key);
  } else if (mode === 'client') {
    const clientCachedItem = ClientSessionCache.getFromClientSessionCache(key);
    cachedItem = clientCachedItem?.value;
  } else if (mode === 'memory') {
    cachedItem = await getFromMemoryCache(store.memoryCache, key);
  }

  if (cachedItem && 'encryptedData' in cachedItem) {
    const { encryptedData, iv, authTag, encryptionKey, type } = cachedItem;

    try {
      // Decrypt the data
      const decrypted = await decrypt(encryptedData, iv, authTag, encryptionKey, store.config);

      // Decompress the decrypted data
      const decompressed = await decompressData(Buffer.from(decrypted, 'base64'));

      if (mode === 'server') {
        await recordAccess(key);
      }

      try {
        // Parse the decompressed data
        const parsedValue = JSON.parse(decompressed) as T;
        return { value: parsedValue };
      } catch (parseError) {
        return { value: null };
      }
    } catch (error) {
      return { value: null };
    }
  }
  return { value: null };
}

/**
 * remove function deletes a value from the cache in the specified mode (server, client, or memory).
 * @param key The key of the value to remove.
 * @param mode The storage mode: 'server', 'client', or 'memory'.
 */
export async function remove(key: string, mode: 'server' | 'client' | 'memory'): Promise<void> {
  const store = await getOrCreateStoreInstance();

  if (mode === 'server') {
    await removeFromTwoLevelCache(store.serverCache, key);
    // The storage removal will be handled by the BatchWriter
  } else if (mode === 'client') {
    ClientSessionCache.removeFromClientSessionCache(key);
  } else if (mode === 'memory') {
    await deleteFromMemoryCache(store.memoryCache, key);
  }
}

/**
 * cleanup function performs necessary cleanup operations,
 * such as stopping the batch writer and clearing the store instance.
 */
export async function cleanup(): Promise<void> {
  const store = await getOrCreateStoreInstance();
  if (store) {
    await stopBatchWriter(store.batchWriter);
    storeInstance = null;
  }
}
