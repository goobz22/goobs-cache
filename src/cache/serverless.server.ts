/**
 * @file ServerCache.ts
 * @description Implements a server-side cache with LRU strategy, compression, and encryption capabilities for serverless environments.
 */

'use server';

import { LRUCache } from 'lru-cache';
import { EncryptedValue, CacheConfig, EvictionPolicy, DataValue, CacheResult } from '../types';
import { compressData, decompressData } from '../utils/compression.server';
import { encrypt, decrypt } from '../utils/encryption.server';
import { incrementGetHitCount, incrementSetHitCount, setHitCounts } from '../utils/hitCount.server';
import {
  getLastUpdatedDate,
  updateLastUpdatedDate,
  updateLastAccessedDate,
  updateLastDates,
} from '../utils/lastDate.server';
import { realTimeSync } from '../utils/realTimeServerToClient';

interface CacheStructure {
  [identifier: string]: {
    [storeName: string]: LRUCache<string, CacheResult>;
  };
}

class ServerCache {
  private cache: CacheStructure = {};
  private config: CacheConfig;
  private encryptionPassword: string;

  constructor(config: CacheConfig, encryptionPassword: string) {
    this.config = config;
    this.encryptionPassword = encryptionPassword;
  }

  private getOrCreateCache(identifier: string, storeName: string): LRUCache<string, CacheResult> {
    if (!this.cache[identifier]) {
      this.cache[identifier] = {};
    }
    if (!this.cache[identifier][storeName]) {
      this.cache[identifier][storeName] = new LRUCache<string, CacheResult>({
        max: this.config.cacheSize,
        ttl: this.config.cacheMaxAge,
        updateAgeOnGet: true,
      });
    }
    return this.cache[identifier][storeName];
  }

  private async shouldCompress(value: EncryptedValue): Promise<boolean> {
    const stringValue = JSON.stringify(value);
    return stringValue.length > 1024; // Compress if larger than 1KB
  }

  private async compressItem(item: CacheResult): Promise<CacheResult> {
    if (item.value && typeof item.value === 'object' && 'encryptedData' in item.value) {
      const encryptedValue = item.value as EncryptedValue;
      if (await this.shouldCompress(encryptedValue)) {
        const compressedValue = await compressData(JSON.stringify(encryptedValue));
        return {
          ...item,
          value: JSON.parse(compressedValue.toString('utf-8')),
        };
      }
    }
    return item;
  }

  private async decompressItem(item: CacheResult): Promise<EncryptedValue> {
    if (item.value && typeof item.value === 'object' && 'encryptedData' in item.value) {
      const encryptedValue = item.value as EncryptedValue;
      const decompressedValue = await decompressData(Buffer.from(JSON.stringify(encryptedValue)));
      return JSON.parse(decompressedValue);
    }
    throw new Error('Invalid item value');
  }

  async get(identifier: string, storeName: string): Promise<CacheResult> {
    const cache = this.getOrCreateCache(identifier, storeName);
    const cacheResult = cache.get(identifier);

    if (cacheResult) {
      const lastUpdatedDate = await getLastUpdatedDate(
        (key) => Promise.resolve(cache.get(key)?.value as string | null),
        identifier,
        storeName,
      );

      const isFresh = lastUpdatedDate > new Date(Date.now() - this.config.cacheMaxAge);

      if (isFresh) {
        await incrementGetHitCount(
          (key) => Promise.resolve(cache.get(key)?.value as string | null),
          async (key, value) => {
            const encryptedValue = await encrypt(
              new TextEncoder().encode(value),
              this.encryptionPassword,
              this.config,
            );
            cache.set(key, { ...cacheResult, value: encryptedValue });
          },
          identifier,
          storeName,
        );

        await updateLastAccessedDate(
          async (key, value) => {
            const encryptedValue = await encrypt(
              new TextEncoder().encode(value),
              this.encryptionPassword,
              this.config,
            );
            cache.set(key, { ...cacheResult, value: encryptedValue });
          },
          identifier,
          storeName,
        );

        if (
          cacheResult.value &&
          typeof cacheResult.value === 'object' &&
          'encryptedData' in cacheResult.value
        ) {
          const decryptedItem = await decrypt(
            cacheResult.value as EncryptedValue,
            this.encryptionPassword,
            this.config,
          );
          return {
            ...cacheResult,
            value: JSON.parse(new TextDecoder().decode(decryptedItem)) as DataValue,
          };
        }
      }
    }

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

  async set(
    identifier: string,
    storeName: string,
    value: DataValue,
    expirationDate: Date,
  ): Promise<void> {
    const encryptedValue = await encrypt(
      new TextEncoder().encode(JSON.stringify(value)),
      this.encryptionPassword,
      this.config,
    );
    const cacheResult: CacheResult = {
      identifier,
      storeName,
      value: encryptedValue,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 1,
    };
    const compressedItem = await this.compressItem(cacheResult);
    const cache = this.getOrCreateCache(identifier, storeName);
    cache.set(identifier, compressedItem);

    await incrementSetHitCount(
      (key) => Promise.resolve(cache.get(key)?.value as string | null),
      async (key, value) => {
        const encryptedValue = await encrypt(
          new TextEncoder().encode(value),
          this.encryptionPassword,
          this.config,
        );
        cache.set(key, { ...compressedItem, value: encryptedValue });
      },
      identifier,
      storeName,
    );

    await updateLastUpdatedDate(
      async (key, value) => {
        const encryptedValue = await encrypt(
          new TextEncoder().encode(value),
          this.encryptionPassword,
          this.config,
        );
        cache.set(key, { ...compressedItem, value: encryptedValue });
      },
      identifier,
      storeName,
    );

    // Notify the Real-Time Server-Client Sync system
    await realTimeSync.handleCacheUpdate(compressedItem);
  }

  async remove(identifier: string, storeName: string): Promise<void> {
    const cache = this.getOrCreateCache(identifier, storeName);
    cache.delete(identifier);

    // Reset hit counts and last updated/accessed times
    await setHitCounts(
      async (key, value) => {
        const encryptedValue = await encrypt(
          new TextEncoder().encode(value),
          this.encryptionPassword,
          this.config,
        );
        cache.set(key, {
          identifier,
          storeName,
          value: encryptedValue,
          expirationDate: new Date(0),
          lastUpdatedDate: new Date(0),
          lastAccessedDate: new Date(0),
          getHitCount: 0,
          setHitCount: 0,
        });
      },
      identifier,
      storeName,
      0,
      0,
    );

    await updateLastDates(
      async (key, value) => {
        const encryptedValue = await encrypt(
          new TextEncoder().encode(value),
          this.encryptionPassword,
          this.config,
        );
        cache.set(key, {
          identifier,
          storeName,
          value: encryptedValue,
          expirationDate: new Date(0),
          lastUpdatedDate: new Date(0),
          lastAccessedDate: new Date(0),
          getHitCount: 0,
          setHitCount: 0,
        });
      },
      identifier,
      storeName,
      { lastUpdatedDate: new Date(0), lastAccessedDate: new Date(0) },
    );

    // Notify the Real-Time Server-Client Sync system of the removal
    await realTimeSync.handleCacheUpdate({
      identifier,
      storeName,
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    });
  }

  async clear(): Promise<void> {
    this.cache = {};
    // Notify the Real-Time Server-Client Sync system of the clear operation
    await realTimeSync.handleCacheUpdate({
      identifier: 'all',
      storeName: 'all',
      value: undefined,
      expirationDate: new Date(0),
      lastUpdatedDate: new Date(0),
      lastAccessedDate: new Date(0),
      getHitCount: 0,
      setHitCount: 0,
    });
  }

  async setEvictionPolicy(policy: EvictionPolicy): Promise<void> {
    for (const identifier in this.cache) {
      for (const storeName in this.cache[identifier]) {
        const cache = this.cache[identifier][storeName];
        switch (policy) {
          case 'lfu':
            cache.allowStale = true;
            cache.updateAgeOnGet = false;
            break;
          case 'lru':
          default:
            cache.allowStale = false;
            cache.updateAgeOnGet = true;
            break;
        }
      }
    }
  }

  async getByIdentifierAndStoreName(identifier: string, storeName: string): Promise<DataValue[]> {
    const cache = this.getOrCreateCache(identifier, storeName);
    const values: DataValue[] = [];
    for (const [key, item] of cache.entries()) {
      if (
        key === identifier &&
        item.value &&
        typeof item.value === 'object' &&
        'encryptedData' in item.value
      ) {
        const decryptedValue = await decrypt(
          item.value as EncryptedValue,
          this.encryptionPassword,
          this.config,
        );
        values.push(JSON.parse(new TextDecoder().decode(decryptedValue)) as DataValue);
      }
    }
    return values;
  }

  subscribeToUpdates<T extends DataValue>(
    identifier: string,
    storeName: string,
    listener: (data: T) => void,
  ): () => void {
    return realTimeSync.subscribe<T>(identifier, storeName, listener);
  }
}

export async function createServerCache(
  config: CacheConfig,
  encryptionPassword: string,
): Promise<ServerCache> {
  return new ServerCache(config, encryptionPassword);
}

export type { ServerCache };
