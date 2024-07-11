'use server';

import { LRUCache } from 'lru-cache';
import {
  StorageInterface,
  EncryptedValue,
  CacheItem,
  CacheConfig,
  CacheStatistics,
  EvictionPolicy,
} from '../types';
import { compressData, decompressData } from '../utils/Compression.server';
import { encrypt, decrypt } from '../utils/Encryption.server';
import { autoTune } from '../utils/AutoTune.server';

class ServerCache {
  private memoryCache: LRUCache<string, CacheItem<EncryptedValue>>;
  private storage: StorageInterface;
  private config: CacheConfig;
  private hitCount: number = 0;
  private missCount: number = 0;
  private evictionCount: number = 0;
  private totalAccessTime: number = 0;
  private accessCount: number = 0;

  constructor(storage: StorageInterface, config: CacheConfig) {
    this.storage = storage;
    this.config = config;
    this.memoryCache = new LRUCache<string, CacheItem<EncryptedValue>>({
      max: config.cacheSize,
      ttl: config.cacheMaxAge,
      updateAgeOnGet: true,
      dispose: (value, key) => {
        this.evictionCount++;
      },
    });

    setInterval(() => this.runAutoTune(), config.autoTuneInterval);
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
      return JSON.parse(decompressedValue.toString());
    }
    return item.value;
  }

  private calculateItemSize(value: EncryptedValue): number {
    return Buffer.from(JSON.stringify(value)).length;
  }

  private updateStatistics(hit: boolean, accessTime: number) {
    if (hit) {
      this.hitCount++;
    } else {
      this.missCount++;
    }
    this.totalAccessTime += accessTime;
    this.accessCount++;
  }

  async get(key: string): Promise<any | undefined> {
    const start = performance.now();
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && memoryItem.expirationDate > new Date()) {
      const end = performance.now();
      this.updateStatistics(true, end - start);
      memoryItem.hitCount++;
      memoryItem.lastAccessed = Date.now();
      const decryptedValue = await decrypt(memoryItem.value, this.config);
      return JSON.parse(decryptedValue);
    }

    const storageItem = await this.storage.get(key);
    const end = performance.now();
    this.updateStatistics(false, end - start);

    if (storageItem) {
      const decryptedItem = await decrypt(storageItem.value, this.config);
      const decompressedItem = await this.decompressItem({
        ...storageItem,
        value: JSON.parse(decryptedItem),
        compressed: false,
      });
      this.memoryCache.set(key, {
        ...storageItem,
        value: JSON.parse(decryptedItem),
        compressed: false,
      });
      return JSON.parse(decryptedItem);
    }

    return undefined;
  }

  async set(key: string, value: any, expirationDate: Date): Promise<void> {
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
    this.memoryCache.set(key, compressedItem);
    await this.storage.set(key, compressedItem);
  }

  async remove(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.storage.remove(key);
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    await this.storage.clear();
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
    this.totalAccessTime = 0;
    this.accessCount = 0;
  }

  async getStatistics(): Promise<CacheStatistics> {
    const storageStats = await this.storage.getStatistics();
    const totalRequests = this.hitCount + this.missCount;
    return {
      ...storageStats,
      hitRate: totalRequests > 0 ? this.hitCount / totalRequests : 0,
      missRate: totalRequests > 0 ? this.missCount / totalRequests : 0,
      evictionCount: this.evictionCount,
      totalItems: this.memoryCache.size,
      memoryUsage: process.memoryUsage().heapUsed,
      averageAccessTime: this.accessCount > 0 ? this.totalAccessTime / this.accessCount : 0,
      memorySize: this.memoryCache.size,
    };
  }

  async setEvictionPolicy(policy: EvictionPolicy): Promise<void> {
    switch (policy) {
      case 'lfu':
        this.memoryCache.allowStale = true;
        this.memoryCache.updateAgeOnGet = false;
        break;
      case 'lru':
      case 'adaptive':
      default:
        this.memoryCache.allowStale = false;
        this.memoryCache.updateAgeOnGet = true;
        break;
    }
  }

  private async runAutoTune(): Promise<void> {
    const stats = await this.getStatistics();
    const currentSize = this.memoryCache.max;

    await autoTune(
      stats,
      currentSize,
      this.config.maxMemoryUsage,
      this.config.cacheSize,
      (newSize) => this.resizeCache(newSize),
      (policy) => this.setEvictionPolicy(policy),
    );

    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
    this.totalAccessTime = 0;
    this.accessCount = 0;
  }

  async resizeCache(newSize: number): Promise<void> {
    const oldCache = this.memoryCache;
    this.memoryCache = new LRUCache<string, CacheItem<EncryptedValue>>({
      max: newSize,
      ttl: this.config.cacheMaxAge,
      updateAgeOnGet: true,
      dispose: (value, key) => {
        this.evictionCount++;
      },
    });
    for (const [key, value] of oldCache.entries()) {
      this.memoryCache.set(key, value);
    }
  }
}

export async function createServerCache(
  storage: StorageInterface,
  config: CacheConfig,
): Promise<ServerCache> {
  return new ServerCache(storage, config);
}

export type { ServerCache };
