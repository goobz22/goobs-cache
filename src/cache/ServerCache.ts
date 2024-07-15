/**
 * @file ServerCache.ts
 * @description Implements a server-side cache with LRU strategy, compression, and encryption capabilities for serverless environments.
 */

'use server';

import { LRUCache } from 'lru-cache';
import { EncryptedValue, CacheItem, CacheConfig, EvictionPolicy, DataValue } from '../types';
import { compressData, decompressData } from '../utils/Compression.server';
import { encrypt, decrypt } from '../utils/Encryption.server';

interface CacheStructure {
  [identifier: string]: {
    [storeName: string]: LRUCache<string, CacheItem<EncryptedValue>>;
  };
}

class ServerCache {
  private cache: CacheStructure = {};
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  private getOrCreateCache(
    identifier: string,
    storeName: string,
  ): LRUCache<string, CacheItem<EncryptedValue>> {
    if (!this.cache[identifier]) {
      this.cache[identifier] = {};
    }
    if (!this.cache[identifier][storeName]) {
      this.cache[identifier][storeName] = new LRUCache<string, CacheItem<EncryptedValue>>({
        max: this.config.cacheSize,
        ttl: this.config.cacheMaxAge,
        updateAgeOnGet: true,
      });
    }
    return this.cache[identifier][storeName];
  }

  private shouldCompress(value: EncryptedValue): boolean {
    const stringValue = JSON.stringify(value);
    return stringValue.length > 1024; // Compress if larger than 1KB
  }

  private async compressItem(item: CacheItem<EncryptedValue>): Promise<CacheItem<EncryptedValue>> {
    if (!item.compressed && this.shouldCompress(item.value)) {
      const compressedValue = await compressData(JSON.stringify(item.value));
      return {
        ...item,
        value: JSON.parse(compressedValue.toString('utf-8')),
        compressed: true,
        size: compressedValue.length,
      };
    }
    return item;
  }

  private async decompressItem(item: CacheItem<EncryptedValue>): Promise<EncryptedValue> {
    if (item.compressed) {
      const decompressedValue = await decompressData(Buffer.from(JSON.stringify(item.value)));
      return JSON.parse(decompressedValue);
    }
    return item.value;
  }

  private calculateItemSize(value: EncryptedValue): number {
    return Buffer.from(JSON.stringify(value)).length;
  }

  async get<T extends DataValue>(identifier: string, storeName: string): Promise<T | undefined> {
    const cache = this.getOrCreateCache(identifier, storeName);
    const cacheItem = cache.get(identifier);

    if (cacheItem) {
      const decryptedItem = await decrypt(cacheItem.value, this.config);
      return JSON.parse(decryptedItem) as T;
    }

    return undefined;
  }

  async set<T extends DataValue>(
    identifier: string,
    storeName: string,
    value: T,
    expirationDate: Date,
  ): Promise<void> {
    const encryptedValue = await encrypt(JSON.stringify(value), this.config);
    const item: CacheItem<EncryptedValue> = {
      value: encryptedValue,
      lastAccessed: Date.now(),
      expirationDate,
      hitCount: 0,
      compressed: false,
      size: this.calculateItemSize(encryptedValue),
    };
    const compressedItem = await this.compressItem(item);
    const cache = this.getOrCreateCache(identifier, storeName);
    cache.set(identifier, compressedItem);
  }

  async remove(identifier: string, storeName: string): Promise<void> {
    const cache = this.getOrCreateCache(identifier, storeName);
    cache.delete(identifier);
  }

  async clear(): Promise<void> {
    this.cache = {};
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

  async getByIdentifierAndStoreName<T extends DataValue>(
    identifier: string,
    storeName: string,
  ): Promise<T[]> {
    const cache = this.getOrCreateCache(identifier, storeName);
    const values: T[] = [];
    for (const item of cache.values()) {
      const decryptedValue = await decrypt(item.value, this.config);
      values.push(JSON.parse(decryptedValue) as T);
    }
    return values;
  }
}

export async function createServerCache(config: CacheConfig): Promise<ServerCache> {
  return new ServerCache(config);
}

export type { ServerCache };
