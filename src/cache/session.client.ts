/**
 * @file SessionStorage.client.ts
 * @description Implements a client-side cache using SessionStorage with encryption, compression, and hit count tracking.
 */

'use client';

import { createLogger, format, transports, Logger } from 'winston';
import { EncryptedValue, SessionCacheConfig, DataValue, CacheResult, GlobalConfig } from '../types';
import { EncryptionModule } from '../utils/encryption.client';
import HitCountModule from '../utils/hitCount.client';
import ClientLastDateModule from '../utils/lastDate.client';
import { CompressionModule } from '../utils/compression.client';

let logger: Logger;

interface CacheStructure {
  [identifier: string]: {
    [storeName: string]: CacheResult[];
  };
}

class SessionStorageCache {
  private cache: CacheStructure = {};
  private config: SessionCacheConfig;
  private globalConfig: GlobalConfig;
  private encryptionModule: EncryptionModule;
  private compressionModule: CompressionModule;

  constructor(config: SessionCacheConfig, globalConfig: GlobalConfig) {
    this.config = config;
    this.globalConfig = globalConfig;
    this.initializeLogger();
    this.encryptionModule = new EncryptionModule(config.encryption, globalConfig);
    this.compressionModule = new CompressionModule(config.compression, globalConfig);
    HitCountModule.initializeLogger(globalConfig);
    ClientLastDateModule.initializeLogger(globalConfig);
    logger.info('Initializing SessionStorageCache', {
      config: { ...config, encryptionPassword: '[REDACTED]' },
      globalConfig: { ...globalConfig, encryptionPassword: '[REDACTED]' },
    });
    this.loadFromSessionStorage();
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
      defaultMeta: { service: 'session-storage-cache' },
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
      ],
    });
  }

  private loadFromSessionStorage(): void {
    const startTime = performance.now();
    logger.info('Loading cache from SessionStorage');
    const cacheString = sessionStorage.getItem('reusableStore');
    if (cacheString) {
      try {
        this.cache = JSON.parse(cacheString) as CacheStructure;
        logger.info('Cache loaded successfully from SessionStorage');
      } catch (error) {
        logger.error('Failed to parse session cache', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    } else {
      logger.info('No existing cache found in SessionStorage');
    }
    const duration = performance.now() - startTime;
    logger.debug('SessionStorage load operation completed', {
      duration: `${duration.toFixed(2)}ms`,
    });
  }

  private saveToSessionStorage(): void {
    const startTime = performance.now();
    logger.info('Saving cache to SessionStorage');
    try {
      const cacheString = JSON.stringify(this.cache);
      sessionStorage.setItem('reusableStore', cacheString);
      logger.info('Cache saved successfully to SessionStorage');
    } catch (error) {
      logger.error('Failed to set session cache', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
    const duration = performance.now() - startTime;
    logger.debug('SessionStorage save operation completed', {
      duration: `${duration.toFixed(2)}ms`,
    });
  }

  private encryptValue(value: DataValue, callback: (result: EncryptedValue | null) => void): void {
    const startTime = performance.now();
    logger.debug('Encrypting value');
    const stringValue = JSON.stringify(value);
    const encoder = new TextEncoder();
    const dataArray = encoder.encode(stringValue);
    const compressedValue = this.compressionModule.compressData(dataArray);
    logger.debug('Value compressed');

    this.encryptionModule.encrypt(compressedValue, (encryptedValue: EncryptedValue | null) => {
      logger.debug('Value encrypted');
      const duration = performance.now() - startTime;
      logger.debug('Encryption operation completed', { duration: `${duration.toFixed(2)}ms` });
      callback(encryptedValue);
    });
  }

  private decryptValue(
    encryptedValue: EncryptedValue,
    callback: (result: DataValue | null) => void,
  ): void {
    const startTime = performance.now();
    logger.debug('Decrypting value');
    this.encryptionModule.decrypt(encryptedValue, (decrypted: Uint8Array | null) => {
      if (decrypted) {
        try {
          const decompressedValue = this.compressionModule.decompressData(decrypted, 'uint8array');
          logger.debug('Value decompressed');
          if (decompressedValue instanceof Uint8Array) {
            const decompressedString = new TextDecoder().decode(decompressedValue);
            try {
              const parsedValue = JSON.parse(decompressedString) as DataValue;
              logger.debug('Decrypted value parsed as JSON');
              const duration = performance.now() - startTime;
              logger.debug('Decryption completed', { duration: `${duration.toFixed(2)}ms` });
              callback(parsedValue);
            } catch (error) {
              logger.warn('Failed to parse decrypted value as JSON. Returning as string.', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
              });
              callback(decompressedString as DataValue);
            }
          } else {
            logger.warn('Decompressed value is not a Uint8Array. Returning as is.');
            callback(decompressedValue as DataValue);
          }
        } catch (error) {
          logger.error('Error during decompression:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
          callback(null);
        }
      } else {
        logger.warn('Decryption failed. Returning null.');
        callback(null);
      }
    });
  }

  set(identifier: string, storeName: string, value: DataValue, expirationDate: Date): void {
    const startTime = performance.now();
    logger.info(`Setting cache value for ${identifier}/${storeName}`);
    this.encryptValue(value, (encryptedValue: EncryptedValue | null) => {
      if (encryptedValue) {
        if (!this.cache[identifier]) {
          this.cache[identifier] = {};
        }
        if (!this.cache[identifier][storeName]) {
          this.cache[identifier][storeName] = [];
        }

        logger.debug(`Incrementing set hit count for ${identifier}/${storeName}`);
        HitCountModule.incrementSetHitCount(
          (key: string) => sessionStorage.getItem(key),
          (key: string, value: string) => sessionStorage.setItem(key, value),
          identifier,
          storeName,
        );

        const newCacheResult: CacheResult = {
          identifier,
          storeName,
          value: encryptedValue,
          expirationDate,
          lastUpdatedDate: new Date(),
          lastAccessedDate: new Date(),
          getHitCount: 0,
          setHitCount: 1,
        };

        this.cache[identifier][storeName] = [newCacheResult];

        this.saveToSessionStorage();

        logger.debug(`Updating last dates for ${identifier}/${storeName}`);
        ClientLastDateModule.updateLastDates(
          (key: string, value: string) => sessionStorage.setItem(key, value),
          identifier,
          storeName,
          {
            lastUpdatedDate: newCacheResult.lastUpdatedDate,
            lastAccessedDate: newCacheResult.lastAccessedDate,
          },
        );

        const duration = performance.now() - startTime;
        logger.debug('Set operation completed', { duration: `${duration.toFixed(2)}ms` });
      } else {
        logger.error(`Failed to encrypt value for ${identifier}/${storeName}`);
      }
    });
  }

  get(
    identifier: string,
    storeName: string,
    callback: (result: CacheResult | undefined) => void,
  ): void {
    const startTime = performance.now();
    logger.info(`Getting cache value for ${identifier}/${storeName}`);
    const items = this.cache[identifier]?.[storeName] || [];
    const now = new Date();
    const validItems = items.filter((item) => item.expirationDate > now);

    if (validItems.length === 0) {
      logger.info(`No valid cache items found for ${identifier}/${storeName}`);
      callback(undefined);
      const duration = performance.now() - startTime;
      logger.debug('Get operation completed (no valid items)', {
        duration: `${duration.toFixed(2)}ms`,
      });
      return;
    }

    logger.debug(`Incrementing get hit count for ${identifier}/${storeName}`);
    HitCountModule.incrementGetHitCount(
      (key: string) => sessionStorage.getItem(key),
      (key: string, value: string) => sessionStorage.setItem(key, value),
      identifier,
      storeName,
    );

    const latestItem = validItems[validItems.length - 1];
    this.decryptValue(latestItem.value as EncryptedValue, (decryptedValue: DataValue | null) => {
      if (decryptedValue) {
        logger.debug(`Getting hit counts for ${identifier}/${storeName}`);
        const getHitCountResult = HitCountModule.getHitCounts(
          (key: string) => sessionStorage.getItem(key),
          identifier,
          storeName,
        );

        logger.debug(`Getting last dates for ${identifier}/${storeName}`);
        const { lastUpdatedDate, lastAccessedDate } = ClientLastDateModule.getLastDates(
          (key: string) => sessionStorage.getItem(key),
          identifier,
          storeName,
        );

        callback({
          identifier,
          storeName,
          value: decryptedValue,
          expirationDate: latestItem.expirationDate,
          lastUpdatedDate,
          lastAccessedDate,
          getHitCount: getHitCountResult.getHitCount,
          setHitCount: getHitCountResult.setHitCount,
        });
        logger.info(`Cache value retrieved successfully for ${identifier}/${storeName}`);

        logger.debug(`Updating last accessed date for ${identifier}/${storeName}`);
        ClientLastDateModule.updateLastDates(
          (key: string, value: string) => sessionStorage.setItem(key, value),
          identifier,
          storeName,
          { lastAccessedDate: new Date() },
        );

        const duration = performance.now() - startTime;
        logger.debug('Get operation completed', { duration: `${duration.toFixed(2)}ms` });
      } else {
        logger.warn(`Decrypted value not found for ${identifier}/${storeName}`);
        callback(undefined);
      }
    });
  }

  remove(identifier: string, storeName: string): void {
    const startTime = performance.now();
    logger.info(`Removing cache value for ${identifier}/${storeName}`);
    if (this.cache[identifier]) {
      delete this.cache[identifier][storeName];
      if (Object.keys(this.cache[identifier]).length === 0) {
        delete this.cache[identifier];
      }
    }
    this.saveToSessionStorage();

    const getHitCountKey = HitCountModule.getCacheGetHitCountKey(identifier, storeName);
    const setHitCountKey = HitCountModule.getCacheSetHitCountKey(identifier, storeName);

    sessionStorage.removeItem(getHitCountKey);
    sessionStorage.removeItem(setHitCountKey);

    logger.debug(`Removed hit counts for ${identifier}/${storeName}`);

    ClientLastDateModule.updateLastDates(
      (key: string, value: string) => sessionStorage.setItem(key, value),
      identifier,
      storeName,
      { lastUpdatedDate: new Date(0), lastAccessedDate: new Date(0) },
    );
    logger.debug(`Reset last dates to epoch for ${identifier}/${storeName}`);

    logger.info(`Cache value removed for ${identifier}/${storeName}`);
    const duration = performance.now() - startTime;
    logger.debug('Remove operation completed', { duration: `${duration.toFixed(2)}ms` });
  }

  clear(): void {
    const startTime = performance.now();
    logger.info('Clearing all cache values');
    this.cache = {};
    sessionStorage.removeItem('reusableStore');

    for (const key in sessionStorage) {
      if (
        key.endsWith(':hitCount') ||
        key.endsWith(':lastUpdated') ||
        key.endsWith(':lastAccessed')
      ) {
        sessionStorage.removeItem(key);
        logger.debug(`Removed metadata key: ${key}`);
      }
    }

    logger.info('All cache values cleared');
    const duration = performance.now() - startTime;
    logger.debug('Clear operation completed', { duration: `${duration.toFixed(2)}ms` });
  }

  updateConfig(newConfig: SessionCacheConfig, newGlobalConfig: GlobalConfig): void {
    logger.info('Updating SessionStorageCache configuration', {
      oldConfig: { ...this.config, encryptionPassword: '[REDACTED]' },
      newConfig: { ...newConfig, encryptionPassword: '[REDACTED]' },
      oldGlobalConfig: { ...this.globalConfig, encryptionPassword: '[REDACTED]' },
      newGlobalConfig: { ...newGlobalConfig, encryptionPassword: '[REDACTED]' },
    });
    this.config = newConfig;
    this.globalConfig = newGlobalConfig;
    this.encryptionModule.updateConfig(newConfig.encryption, newGlobalConfig);
    this.compressionModule.updateConfig(newConfig.compression, newGlobalConfig);
    this.initializeLogger();
    HitCountModule.initializeLogger(newGlobalConfig);
    ClientLastDateModule.initializeLogger(newGlobalConfig);
  }
}

export function createSessionStorageCache(
  config: SessionCacheConfig,
  globalConfig: GlobalConfig,
): SessionStorageCache {
  return new SessionStorageCache(config, globalConfig);
}

// Add an unhandled rejection handler for browser environments
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    logger.error('Unhandled Rejection at:', {
      reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
    });
  });
}

export { logger as sessionStorageLogger };

export default SessionStorageCache;
