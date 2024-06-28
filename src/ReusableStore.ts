'use server';

import {
  createTwoLevelCache,
  getFromTwoLevelCache,
  setToTwoLevelCache,
  removeFromTwoLevelCache,
} from './cache/TwoLevelCache';
import { createMemoryStorage } from './storage/MemoryStorage';
import { createMongoDbStorage, closeMongoDbConnection } from './storage/MongoDbStorage';
import {
  encrypt,
  decrypt,
  rotateEncryptionKey,
  getLastRotationTime,
} from './encryption/EncryptionUtility';
import { compressData, decompressData } from './compression/CompressionUtility';
import { createAccessTracker, recordAccess } from './utils/AccessTracker';
import { createPrefetcher, prefetchFrequentItems } from './utils/Prefetcher';
import { createBatchWriter, addToBatch, stopBatchWriter } from './utils/BatchWriter';
import getConfig from './config/config';
import { DataValue, EncryptedValue } from './types/DataTypes';
import { StorageInterface } from './storage/StorageInterface';

/**
 * storeInstance represents the instance of the store, which includes the cache,
 * storage, access tracker, prefetcher, and batch writer.
 */
let storeInstance: {
  cache: Awaited<ReturnType<typeof createTwoLevelCache>>;
  storage: StorageInterface;
  accessTracker: Awaited<ReturnType<typeof createAccessTracker>>;
  prefetcher: Awaited<ReturnType<typeof createPrefetcher>>;
  batchWriter: Awaited<ReturnType<typeof createBatchWriter>>;
} | null = null;

/**
 * keyRotationInterval represents the interval for checking and performing key rotation.
 */
let keyRotationInterval: NodeJS.Timeout | null = null;

/**
 * getOrCreateStoreInstance function retrieves the existing store instance or creates a new one if it doesn't exist.
 * It initializes the cache, storage, access tracker, prefetcher, and batch writer based on the configuration.
 * It also starts periodic tasks such as prefetching frequent items and checking for key rotation.
 * @returns The store instance.
 */
async function getOrCreateStoreInstance() {
  if (!storeInstance) {
    const config = await getConfig();
    const storage =
      config.storageType === 'mongodb' ? await createMongoDbStorage() : await createMemoryStorage();

    const cache = await createTwoLevelCache(storage);
    const accessTracker = await createAccessTracker();
    const prefetcher = await createPrefetcher(cache, accessTracker);
    const batchWriter = await createBatchWriter(
      storage,
      config.batchSize,
      config.persistenceInterval,
    );

    storeInstance = {
      cache,
      storage,
      accessTracker,
      prefetcher,
      batchWriter,
    };

    // Start periodic tasks
    setInterval(() => prefetchFrequentItems(prefetcher), config.prefetchInterval);

    // Set up key rotation check
    if (!keyRotationInterval) {
      keyRotationInterval = setInterval(
        async () => {
          const currentTime = Date.now();
          const lastRotation = await getLastRotationTime();
          if (currentTime - lastRotation >= config.keyRotationIntervalMs) {
            await rotateEncryptionKey();
          }
        },
        Math.min(3600000, config.keyRotationIntervalMs),
      ); // Check every hour or at the rotation interval, whichever is shorter
    }
  }

  return storeInstance;
}

/**
 * set function sets a key-value pair in the store with an expiration date.
 * It compresses and encrypts the value before storing it in the cache and adding it to the batch writer.
 * It also records the access of the key.
 * @param key The key of the item to set.
 * @param value The value of the item to set.
 * @param expirationDate The expiration date of the item.
 */
export async function set(key: string, value: DataValue, expirationDate: Date): Promise<void> {
  const store = await getOrCreateStoreInstance();
  const compressedValue = await compressData(JSON.stringify(value));
  const { encryptedData, authTag, keyId } = await encrypt(compressedValue.toString('base64'));
  const encryptedValue: EncryptedValue = { encryptedData, authTag, keyId, type: value.type };
  await setToTwoLevelCache(store.cache, key, encryptedValue, expirationDate);
  await addToBatch(store.batchWriter, key, encryptedValue, expirationDate);
  await recordAccess(key);
}

/**
 * get function retrieves the value associated with a key from the store.
 * It retrieves the item from the cache, decrypts and decompresses the value, and records the access of the key.
 * @param key The key of the item to retrieve.
 * @returns The value associated with the key, or undefined if not found.
 */
export async function get(key: string): Promise<string | undefined> {
  const store = await getOrCreateStoreInstance();
  const cachedItem = await getFromTwoLevelCache(store.cache, key);
  if (cachedItem && 'encryptedData' in cachedItem) {
    const { encryptedData, authTag, keyId, type } = cachedItem as EncryptedValue;
    const decrypted = await decrypt(encryptedData, authTag, keyId);
    const decompressed = await decompressData(Buffer.from(decrypted, 'base64'));
    await recordAccess(key);
    const value = JSON.parse(decompressed);

    // Return the value directly, not as an object
    return value.value;
  }
  return undefined;
}

/**
 * remove function removes an item from the store by its key.
 * It removes the item from the cache, and the storage removal will be handled by the BatchWriter.
 * @param key The key of the item to remove.
 */
export async function remove(key: string): Promise<void> {
  const store = await getOrCreateStoreInstance();
  await removeFromTwoLevelCache(store.cache, key);
  // The storage removal will be handled by the BatchWriter
}

/**
 * cleanup function performs cleanup operations for the store.
 * It stops the batch writer, closes the MongoDB connection if applicable,
 * and clears the key rotation interval.
 */
export async function cleanup(): Promise<void> {
  if (storeInstance) {
    await stopBatchWriter(storeInstance.batchWriter);
    if (storeInstance.storage.constructor.name === 'MongoDbStorage') {
      await closeMongoDbConnection(storeInstance.storage);
    }
    if (keyRotationInterval) {
      clearInterval(keyRotationInterval);
      keyRotationInterval = null;
    }
    storeInstance = null;
  }
}
