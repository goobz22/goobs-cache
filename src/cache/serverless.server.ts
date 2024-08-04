'use server';

import { createLogger, format, transports, Logger } from 'winston';
import { LRUCache } from 'lru-cache';
import {
  EncryptedValue,
  ServerlessCacheConfig,
  EvictionPolicy,
  DataValue,
  CacheResult,
  GlobalConfig,
} from '../types';
import { ServerCompressionModule } from '../utils/compression.server';
import { ServerEncryptionModule } from '../utils/encryption.server';
import ServerHitCountModule from '../utils/hitCount.server';
import ServerLastDateModule from '../utils/lastDate.server';
import path from 'path';

let logger: Logger;

interface CacheStructure {
  [identifier: string]: {
    [storeName: string]: LRUCache<string, CacheResult>;
  };
}

class ServerlessCache {
  private cache: CacheStructure = {};
  private compressionModule: ServerCompressionModule;
  private encryptionModule: ServerEncryptionModule;

  constructor(
    private config: ServerlessCacheConfig,
    private encryptionPassword: string,
    private globalConfig: GlobalConfig,
  ) {
    this.initializeLogger();
    this.compressionModule = new ServerCompressionModule(
      this.config.compression,
      this.globalConfig,
    );
    this.encryptionModule = new ServerEncryptionModule(this.config.encryption, this.globalConfig);
    ServerHitCountModule.initializeLogger(this.globalConfig);
    ServerLastDateModule.initializeLogger(this.globalConfig);
    logger.info('Initializing ServerlessCache', {
      config: { ...config, encryptionPassword: '[REDACTED]' },
      globalConfig: { ...globalConfig, encryptionPassword: '[REDACTED]' },
    });
  }

  private initializeLogger(): void {
    logger = createLogger({
      level: this.globalConfig.logLevel,
      silent: !this.globalConfig.loggingEnabled,
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.json(),
        format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
      ),
      defaultMeta: { service: 'serverless-cache' },
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(({ level, message, timestamp, metadata }) => {
              let msg = `${timestamp} [${level}]: ${message}`;
              if (Object.keys(metadata).length > 0) {
                msg += '\n\t' + JSON.stringify(metadata);
              }
              return msg;
            }),
          ),
        }),
        new transports.File({
          filename: path.join(this.globalConfig.logDirectory, 'serverless-cache-error.log'),
          level: 'error',
        }),
        new transports.File({
          filename: path.join(this.globalConfig.logDirectory, 'serverless-cache-combined.log'),
        }),
      ],
    });
  }

  private getOrCreateCache(identifier: string, storeName: string): LRUCache<string, CacheResult> {
    const startTime = process.hrtime();
    logger.info(`Getting or creating cache for ${identifier}/${storeName}`);
    if (!this.cache[identifier]) {
      this.cache[identifier] = {};
    }
    if (!this.cache[identifier][storeName]) {
      this.cache[identifier][storeName] = new LRUCache<string, CacheResult>({
        max: this.config.cacheSize,
        ttl: this.config.cacheMaxAge,
        updateAgeOnGet: true,
      });
      logger.info(`Created new LRUCache for ${identifier}/${storeName}`);
    }
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1e6;
    logger.debug('getOrCreateCache operation completed', { duration: `${duration.toFixed(2)}ms` });
    return this.cache[identifier][storeName];
  }

  private async shouldCompress(value: string): Promise<boolean> {
    logger.debug('Determining whether compression is needed');
    return value.length > 1024; // Compress if larger than 1KB
  }

  private async compressItem(item: CacheResult): Promise<CacheResult> {
    const startTime = process.hrtime();
    logger.info(`Compressing item for ${item.identifier}/${item.storeName}`);
    try {
      const stringValue = JSON.stringify(item.value);
      if (await this.shouldCompress(stringValue)) {
        const compressedValue = await this.compressionModule.compressData(stringValue);
        logger.info(`Compression successful for ${item.identifier}/${item.storeName}`);
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds * 1000 + nanoseconds / 1e6;
        logger.debug('compressItem operation completed', { duration: `${duration.toFixed(2)}ms` });
        return {
          ...item,
          value: compressedValue.toString('base64'),
        };
      }
      return item;
    } catch (error) {
      logger.error(`Error compressing item for ${item.identifier}/${item.storeName}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  private async decompressItem(item: CacheResult): Promise<CacheResult> {
    const startTime = process.hrtime();
    logger.info(`Decompressing item for ${item.identifier}/${item.storeName}`);
    try {
      if (typeof item.value === 'string') {
        const decompressedValue = await this.compressionModule.decompressData(
          Buffer.from(item.value, 'base64'),
        );
        logger.info(`Decompression successful for ${item.identifier}/${item.storeName}`);
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds * 1000 + nanoseconds / 1e6;
        logger.debug('decompressItem operation completed', {
          duration: `${duration.toFixed(2)}ms`,
        });
        return {
          ...item,
          value: JSON.parse(decompressedValue),
        };
      }
      return item;
    } catch (error) {
      logger.error(`Error decompressing item for ${item.identifier}/${item.storeName}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async get(identifier: string, storeName: string): Promise<CacheResult> {
    const startTime = process.hrtime();
    logger.info(`Getting cache value for ${identifier}/${storeName}`);
    try {
      const cache = this.getOrCreateCache(identifier, storeName);
      const cacheResult = cache.get(identifier);

      if (cacheResult) {
        const lastUpdatedDate = await ServerLastDateModule.getLastUpdatedDate(
          (key) => Promise.resolve(cache.get(key)?.value as string | null),
          identifier,
          storeName,
        );

        const isFresh = lastUpdatedDate > new Date(Date.now() - this.config.cacheMaxAge);

        if (isFresh) {
          await ServerHitCountModule.incrementGetHitCount(
            (key) => Promise.resolve(cache.get(key)?.value as string | null),
            async (key, value) => {
              const encryptedValue = await this.encryptionModule.encrypt(
                new TextEncoder().encode(value),
              );
              cache.set(key, { ...cacheResult, value: encryptedValue });
            },
            identifier,
            storeName,
          );

          await ServerLastDateModule.updateLastAccessedDate(
            async (key, value) => {
              const encryptedValue = await this.encryptionModule.encrypt(
                new TextEncoder().encode(value),
              );
              cache.set(key, { ...cacheResult, value: encryptedValue });
            },
            identifier,
            storeName,
          );

          const decompressedItem = await this.decompressItem(cacheResult);
          const decryptedValue = await this.encryptionModule.decrypt(
            decompressedItem.value as EncryptedValue,
          );
          const result = {
            ...decompressedItem,
            value: JSON.parse(new TextDecoder().decode(decryptedValue)) as DataValue,
          };
          const [seconds, nanoseconds] = process.hrtime(startTime);
          const duration = seconds * 1000 + nanoseconds / 1e6;
          logger.info(`Cache hit for ${identifier}/${storeName}`, {
            duration: `${duration.toFixed(2)}ms`,
          });
          return result;
        }
      }

      logger.warn(`Cache miss for ${identifier}/${storeName}`);
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1e6;
      logger.debug('get operation completed (cache miss)', {
        duration: `${duration.toFixed(2)}ms`,
      });
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
    } catch (error) {
      logger.error(`Error getting cache value for ${identifier}/${storeName}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async set(
    identifier: string,
    storeName: string,
    value: DataValue,
    expirationDate: Date,
  ): Promise<void> {
    const startTime = process.hrtime();
    logger.info(`Setting cache value for ${identifier}/${storeName}`);
    try {
      const stringValue = JSON.stringify(value);
      const encryptedValue = await this.encryptionModule.encrypt(
        new TextEncoder().encode(stringValue),
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

      await ServerHitCountModule.incrementSetHitCount(
        (key) => Promise.resolve(cache.get(key)?.value as string | null),
        async (key, value) => {
          const encryptedValue = await this.encryptionModule.encrypt(
            new TextEncoder().encode(value),
          );
          cache.set(key, { ...compressedItem, value: encryptedValue });
        },
        identifier,
        storeName,
      );

      await ServerLastDateModule.updateLastUpdatedDate(
        async (key, value) => {
          const encryptedValue = await this.encryptionModule.encrypt(
            new TextEncoder().encode(value),
          );
          cache.set(key, { ...compressedItem, value: encryptedValue });
        },
        identifier,
        storeName,
      );
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1e6;
      logger.info(`Cache value set successfully for ${identifier}/${storeName}`, {
        duration: `${duration.toFixed(2)}ms`,
      });
    } catch (error) {
      logger.error(`Error setting cache value for ${identifier}/${storeName}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async remove(identifier: string, storeName: string): Promise<void> {
    const startTime = process.hrtime();
    logger.info(`Removing cache value for ${identifier}/${storeName}`);
    try {
      const cache = this.getOrCreateCache(identifier, storeName);
      cache.delete(identifier);

      // Reset hit counts and last updated/accessed times
      await ServerHitCountModule.setHitCounts(
        async (key, value) => {
          const encryptedValue = await this.encryptionModule.encrypt(
            new TextEncoder().encode(value),
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

      await ServerLastDateModule.updateLastDates(
        async (key, value) => {
          const encryptedValue = await this.encryptionModule.encrypt(
            new TextEncoder().encode(value),
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

      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1e6;
      logger.info(`Cache value removed for ${identifier}/${storeName}`, {
        duration: `${duration.toFixed(2)}ms`,
      });
    } catch (error) {
      logger.error(`Error removing cache value for ${identifier}/${storeName}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async clear(): Promise<void> {
    const startTime = process.hrtime();
    logger.info('Clearing all cache values');
    try {
      this.cache = {};
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1e6;
      logger.info('All cache values cleared successfully', {
        duration: `${duration.toFixed(2)}ms`,
      });
    } catch (error) {
      logger.error('Error clearing all cache values:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async setEvictionPolicy(policy: EvictionPolicy): Promise<void> {
    const startTime = process.hrtime();
    logger.info(`Setting eviction policy to ${policy}`);
    try {
      for (const identifier in this.cache) {
        for (const storeName in this.cache[identifier]) {
          const cache = this.cache[identifier][storeName];
          switch (policy) {
            case 'lfu':
              cache.allowStale = true;
              cache.updateAgeOnGet = false;
              logger.info(`Set LFU policy for ${identifier}/${storeName}`);
              break;
            case 'lru':
            default:
              cache.allowStale = false;
              cache.updateAgeOnGet = true;
              logger.info(`Set LRU policy for ${identifier}/${storeName}`);
              break;
          }
        }
      }
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1e6;
      logger.info(`Eviction policy set successfully to ${policy}`, {
        duration: `${duration.toFixed(2)}ms`,
      });
    } catch (error) {
      logger.error(`Error setting eviction policy to ${policy}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async getByIdentifierAndStoreName(identifier: string, storeName: string): Promise<DataValue[]> {
    const startTime = process.hrtime();
    logger.info(`Getting all values by identifier and store name: ${identifier}/${storeName}`);
    try {
      const cache = this.getOrCreateCache(identifier, storeName);
      const values: DataValue[] = [];
      for (const [key, item] of cache.entries()) {
        if (key === identifier) {
          const decompressedItem = await this.decompressItem(item);
          const decryptedValue = await this.encryptionModule.decrypt(
            decompressedItem.value as EncryptedValue,
          );
          values.push(JSON.parse(new TextDecoder().decode(decryptedValue)) as DataValue);
        }
      }
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1e6;
      logger.info(`Retrieved ${values.length} values for ${identifier}/${storeName}`, {
        duration: `${duration.toFixed(2)}ms`,
      });
      return values;
    } catch (error) {
      logger.error(`Error getting values for ${identifier}/${storeName}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  updateConfig(newConfig: ServerlessCacheConfig, newGlobalConfig: GlobalConfig): void {
    logger.info('Updating ServerlessCache configuration', {
      oldConfig: { ...this.config, encryptionPassword: '[REDACTED]' },
      newConfig: { ...newConfig, encryptionPassword: '[REDACTED]' },
      oldGlobalConfig: { ...this.globalConfig, encryptionPassword: '[REDACTED]' },
      newGlobalConfig: { ...newGlobalConfig, encryptionPassword: '[REDACTED]' },
    });
    this.config = newConfig;
    this.globalConfig = newGlobalConfig;
    this.compressionModule.updateConfig(newConfig.compression, newGlobalConfig);
    this.encryptionModule.updateConfig(newConfig.encryption, newGlobalConfig);
    this.initializeLogger();
    ServerHitCountModule.initializeLogger(newGlobalConfig);
    ServerLastDateModule.initializeLogger(newGlobalConfig);
  }
}

export function createServerlessCache(
  config: ServerlessCacheConfig,
  encryptionPassword: string,
  globalConfig: GlobalConfig,
): ServerlessCache {
  return new ServerlessCache(config, encryptionPassword, globalConfig);
}

// Add an unhandled rejection handler
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

export { logger as serverlessCacheLogger };

export default ServerlessCache;
