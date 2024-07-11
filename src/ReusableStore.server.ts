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

interface StoreInstance {
  serverCache: ServerCache;
  config: CacheConfig;
}

let storeInstance: StoreInstance | null = null;

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

export async function serverSet<T extends DataValue>(
  key: string,
  value: T,
  expirationDate: Date,
): Promise<void> {
  const store = await getOrCreateStoreInstance();
  await store.serverCache.set(key, value, expirationDate);
}

export async function serverGet<T extends DataValue>(key: string): Promise<{ value: T | null }> {
  const store = await getOrCreateStoreInstance();
  const value = await store.serverCache.get(key);
  if (value !== undefined) {
    return { value: value as T };
  }
  return { value: null };
}

export async function serverRemove(key: string): Promise<void> {
  const store = await getOrCreateStoreInstance();
  await store.serverCache.remove(key);
}

export async function cleanup(): Promise<void> {
  const store = await getOrCreateStoreInstance();
  if (store) {
    await store.serverCache.clear();
    storeInstance = null;
  }
}
