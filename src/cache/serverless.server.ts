'use server';

import { LRUCache } from 'lru-cache';
import {
  ServerlessCacheConfig,
  EvictionPolicy,
  DataValue,
  CacheResult,
  GlobalConfig,
  StorageInterface,
  EncryptedValue,
} from '../types';
import ServerHitCountModule from '../utils/hitCount.server';
import ServerLastDateModule from '../utils/lastDate.server';
import { ServerLogger } from 'goobs-testing';
import { ServerCompressionModule } from '../utils/compression.server';
import { ServerEncryptionModule } from '../utils/encryption.server';

let serverlessCache: ServerlessCache | null = null;

interface CacheStructure {
  [identifier: string]: {
    [storeName: string]: LRUCache<string, CacheResult>;
  };
}

class ServerlessCache implements StorageInterface {
  private cache: CacheStructure = {};

  private constructor(
    private config: ServerlessCacheConfig,
    private globalConfig: GlobalConfig,
    private encryptionPassword: string,
  ) {
    ServerLogger.initializeLogger(this.globalConfig);
    ServerHitCountModule.initializeLogger(this.globalConfig);
    ServerLastDateModule.initializeLogger(this.globalConfig);

    // Instead of calling initialize, we'll set the globalConfig directly
    ServerCompressionModule.globalConfig = this.globalConfig;

    ServerEncryptionModule.initialize(
      { ...this.config.encryption, encryptionPassword: this.encryptionPassword },
      this.globalConfig,
    );
    ServerLogger.info('Initializing ServerlessCache', {
      config: { ...config, encryptionPassword: '[REDACTED]' },
      globalConfig: { ...globalConfig, encryptionPassword: '[REDACTED]' },
    });
  }
  static async create(
    config: ServerlessCacheConfig,
    globalConfig: GlobalConfig,
    encryptionPassword: string,
  ): Promise<ServerlessCache> {
    return new ServerlessCache(config, globalConfig, encryptionPassword);
  }

  private getOrCreateCache(identifier: string, storeName: string): LRUCache<string, CacheResult> {
    const startTime = process.hrtime();
    ServerLogger.info(`Getting or creating cache for ${identifier}/${storeName}`);
    if (!this.cache[identifier]) {
      this.cache[identifier] = {};
    }
    if (!this.cache[identifier][storeName]) {
      this.cache[identifier][storeName] = new LRUCache<string, CacheResult>({
        max: this.config.cacheSize,
        ttl: this.config.cacheMaxAge,
        updateAgeOnGet: true,
      });
      ServerLogger.info(`Created new LRUCache for ${identifier}/${storeName}`);
    }
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1e6;
    ServerLogger.debug('getOrCreateCache operation completed', {
      duration: `${duration.toFixed(2)}ms`,
    });
    return this.cache[identifier][storeName];
  }

  async get(identifier: string, storeName: string): Promise<CacheResult[]> {
    const startTime = process.hrtime();
    ServerLogger.info(`Getting cache value for ${identifier}/${storeName}`);
    try {
      const cache = this.getOrCreateCache(identifier, storeName);
      const result = cache.get(`${identifier}:${storeName}`);
      if (result) {
        result.getHitCount++;
        result.lastAccessedDate = new Date();
        cache.set(`${identifier}:${storeName}`, result);
        await ServerHitCountModule.incrementGetHitCount(
          async (k) => {
            const item = cache.get(k);
            return item ? item.getHitCount.toString() : '0';
          },
          async (k, v) => {
            const item = cache.get(k);
            if (item) {
              item.getHitCount = parseInt(v, 10);
              cache.set(k, item);
            }
          },
          identifier,
          storeName,
        );
        await ServerLastDateModule.updateLastAccessedDate(
          async (k, v) => {
            const item = cache.get(k);
            if (item) {
              item.lastAccessedDate = new Date(v);
              cache.set(k, item);
            }
          },
          identifier,
          storeName,
        );

        // Decrypt the value
        const decryptedValue = await ServerEncryptionModule.decrypt(result.value as EncryptedValue);
        const decompressedValue = await ServerCompressionModule.decompressData(
          Buffer.from(decryptedValue),
        );
        result.value = JSON.parse(decompressedValue);
      }
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1e6;
      ServerLogger.info(`Cache value retrieved for ${identifier}/${storeName}`, {
        duration: `${duration.toFixed(2)}ms`,
      });
      return result ? [result] : [];
    } catch (error) {
      ServerLogger.error(`Error getting cache value for ${identifier}/${storeName}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async set(identifier: string, storeName: string, items: CacheResult[]): Promise<void> {
    const startTime = process.hrtime();
    ServerLogger.info(`Setting cache value for ${identifier}/${storeName}`);
    try {
      const cache = this.getOrCreateCache(identifier, storeName);
      for (const item of items) {
        item.setHitCount++;
        item.lastUpdatedDate = new Date();

        // Compress and encrypt the value
        const compressedValue = await ServerCompressionModule.compressData(
          JSON.stringify(item.value),
        );
        const encryptedValue = await ServerEncryptionModule.encrypt(
          Uint8Array.from(compressedValue),
        );
        item.value = encryptedValue;

        cache.set(`${identifier}:${storeName}`, item);
      }
      await ServerHitCountModule.incrementSetHitCount(
        async (k) => {
          const item = cache.get(k);
          return item ? item.setHitCount.toString() : '0';
        },
        async (k, v) => {
          const item = cache.get(k);
          if (item) {
            item.setHitCount = parseInt(v, 10);
            cache.set(k, item);
          }
        },
        identifier,
        storeName,
      );
      await ServerLastDateModule.updateLastDates(
        async (k, v) => {
          const item = cache.get(k);
          if (item) {
            item.lastUpdatedDate = new Date(v);
            item.lastAccessedDate = new Date(v);
            cache.set(k, item);
          }
        },
        identifier,
        storeName,
        { lastUpdatedDate: new Date(), lastAccessedDate: new Date() },
      );
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1e6;
      ServerLogger.info(`Cache value set successfully for ${identifier}/${storeName}`, {
        duration: `${duration.toFixed(2)}ms`,
      });
    } catch (error) {
      ServerLogger.error(`Error setting cache value for ${identifier}/${storeName}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async remove(identifier: string, storeName: string): Promise<void> {
    const startTime = process.hrtime();
    ServerLogger.info(`Removing cache value for ${identifier}/${storeName}`);
    try {
      const cache = this.getOrCreateCache(identifier, storeName);
      cache.delete(`${identifier}:${storeName}`);
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1e6;
      ServerLogger.info(`Cache value removed for ${identifier}/${storeName}`, {
        duration: `${duration.toFixed(2)}ms`,
      });
    } catch (error) {
      ServerLogger.error(`Error removing cache value for ${identifier}/${storeName}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async clear(): Promise<void> {
    const startTime = process.hrtime();
    ServerLogger.info('Clearing all cache values');
    try {
      this.cache = {};
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1e6;
      ServerLogger.info('All cache values cleared', { duration: `${duration.toFixed(2)}ms` });
    } catch (error) {
      ServerLogger.error('Error clearing all cache values:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async setEvictionPolicy(policy: EvictionPolicy): Promise<void> {
    const startTime = process.hrtime();
    ServerLogger.info(`Setting eviction policy to ${policy}`);
    try {
      // Implement the eviction policy logic here
      // This might involve recreating LRUCache instances with new options
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1e6;
      ServerLogger.info(`Eviction policy set successfully to ${policy}`, {
        duration: `${duration.toFixed(2)}ms`,
      });
    } catch (error) {
      ServerLogger.error(`Error setting eviction policy to ${policy}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async updateConfig(
    newConfig: ServerlessCacheConfig,
    newGlobalConfig: GlobalConfig,
    newEncryptionPassword: string,
  ): Promise<void> {
    ServerLogger.info('Updating ServerlessCache configuration', {
      oldConfig: { ...this.config, encryptionPassword: '[REDACTED]' },
      newConfig: { ...newConfig, encryptionPassword: '[REDACTED]' },
      oldGlobalConfig: { ...this.globalConfig, encryptionPassword: '[REDACTED]' },
      newGlobalConfig: { ...newGlobalConfig, encryptionPassword: '[REDACTED]' },
    });
    this.config = newConfig;
    this.globalConfig = newGlobalConfig;
    this.encryptionPassword = newEncryptionPassword;
    ServerLogger.initializeLogger(newGlobalConfig);
    ServerHitCountModule.initializeLogger(newGlobalConfig);
    ServerLastDateModule.initializeLogger(newGlobalConfig);

    // Update ServerCompressionModule's globalConfig directly
    ServerCompressionModule.globalConfig = this.globalConfig;

    ServerEncryptionModule.updateConfig(
      { ...this.config.encryption, encryptionPassword: this.encryptionPassword },
      this.globalConfig,
    );

    // Update configuration for all caches
    for (const identifier in this.cache) {
      for (const storeName in this.cache[identifier]) {
        const newCache = new LRUCache<string, CacheResult>({
          max: this.config.cacheSize,
          ttl: this.config.cacheMaxAge,
          updateAgeOnGet: true,
        });
        this.cache[identifier][storeName].forEach((value, key) => {
          newCache.set(key, value);
        });
        this.cache[identifier][storeName] = newCache;
      }
    }
  }
}

async function initializeServerlessCache(
  config: ServerlessCacheConfig,
  globalConfig: GlobalConfig,
  encryptionPassword: string,
): Promise<ServerlessCache> {
  const startTime = process.hrtime();
  ServerLogger.debug('Initializing serverless cache...', {
    currentInstance: serverlessCache ? 'exists' : 'null',
  });

  try {
    if (!serverlessCache) {
      serverlessCache = await ServerlessCache.create(config, globalConfig, encryptionPassword);
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1e6;
      ServerLogger.info('Serverless cache initialized successfully.', {
        duration: `${duration.toFixed(2)}ms`,
      });
    } else {
      ServerLogger.debug('Serverless cache already initialized, reusing existing instance.');
    }
    return serverlessCache;
  } catch (error) {
    ServerLogger.error('Failed to initialize serverless cache', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

function createServerlessAtom(
  config: ServerlessCacheConfig,
  globalConfig: GlobalConfig,
  encryptionPassword: string,
  identifier: string,
  storeName: string,
) {
  return {
    get: async (): Promise<CacheResult | undefined> => {
      const cache = await initializeServerlessCache(config, globalConfig, encryptionPassword);
      const result = await cache.get(identifier, storeName);
      return result[0];
    },
    set: async (value: DataValue): Promise<void> => {
      const cache = await initializeServerlessCache(config, globalConfig, encryptionPassword);
      const expirationDate = new Date(Date.now() + config.cacheMaxAge);
      await cache.set(identifier, storeName, [
        {
          identifier,
          storeName,
          value,
          expirationDate,
          lastUpdatedDate: new Date(),
          lastAccessedDate: new Date(),
          getHitCount: 0,
          setHitCount: 1,
        },
      ]);
    },
    remove: async (): Promise<void> => {
      const cache = await initializeServerlessCache(config, globalConfig, encryptionPassword);
      await cache.remove(identifier, storeName);
    },
  };
}

export const serverless = {
  atom: createServerlessAtom,
  clear: async (
    config: ServerlessCacheConfig,
    globalConfig: GlobalConfig,
    encryptionPassword: string,
  ): Promise<void> => {
    const cache = await initializeServerlessCache(config, globalConfig, encryptionPassword);
    await cache.clear();
  },
  updateConfig: async (
    config: ServerlessCacheConfig,
    globalConfig: GlobalConfig,
    encryptionPassword: string,
  ): Promise<void> => {
    const cache = await initializeServerlessCache(config, globalConfig, encryptionPassword);
    await cache.updateConfig(config, globalConfig, encryptionPassword);
  },
  setEvictionPolicy: async (
    config: ServerlessCacheConfig,
    globalConfig: GlobalConfig,
    encryptionPassword: string,
    policy: EvictionPolicy,
  ): Promise<void> => {
    const cache = await initializeServerlessCache(config, globalConfig, encryptionPassword);
    await cache.setEvictionPolicy(policy);
  },
};

process.on('uncaughtException', (error: Error) => {
  ServerLogger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
  });
  // Gracefully exit the process after logging
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  ServerLogger.error('Unhandled Rejection at:', {
    promise,
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

export default serverless;
