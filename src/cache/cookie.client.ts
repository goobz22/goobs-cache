'use client';

import { createLogger, format, transports, Logger } from 'winston';
import { EncryptedValue, CookieCacheConfig, DataValue, CacheResult, GlobalConfig } from '../types';
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

class CookieCache {
  private cache: CacheStructure = {};
  private config: CookieCacheConfig;
  private globalConfig: GlobalConfig;
  private encryptionModule: EncryptionModule;
  private compressionModule: CompressionModule;

  constructor(config: CookieCacheConfig, globalConfig: GlobalConfig) {
    this.config = config;
    this.globalConfig = globalConfig;
    this.initializeLogger();
    this.encryptionModule = new EncryptionModule(config.encryption, globalConfig);
    this.compressionModule = new CompressionModule(config.compression, globalConfig);
    HitCountModule.initializeLogger(globalConfig);
    ClientLastDateModule.initializeLogger(globalConfig);
    logger.info('Initializing CookieCache', {
      config: { ...config, encryptionPassword: '[REDACTED]' },
      globalConfig: { ...globalConfig, encryptionPassword: '[REDACTED]' },
    });
    this.loadFromCookies();
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
      defaultMeta: { service: 'cookie-cache' },
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

  private loadFromCookies(): void {
    const startTime = performance.now();
    logger.info('Loading cache from cookies');
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
      const [key, value] = cookie.split('=');
      if (key && value) {
        try {
          const decodedValue = decodeURIComponent(value);
          if (decodedValue) {
            const parsedValue = JSON.parse(decodedValue) as {
              identifier: string;
              storeName: string;
              value: EncryptedValue;
              expirationDate: string;
              lastUpdatedDate: string;
              lastAccessedDate: string;
              getHitCount: number;
              setHitCount: number;
            };
            if (
              parsedValue &&
              typeof parsedValue === 'object' &&
              'identifier' in parsedValue &&
              'storeName' in parsedValue
            ) {
              const { identifier, storeName, ...item } = parsedValue;
              if (!this.cache[identifier]) {
                this.cache[identifier] = {};
              }
              if (!this.cache[identifier][storeName]) {
                this.cache[identifier][storeName] = [];
              }
              this.cache[identifier][storeName].push({
                ...item,
                identifier,
                storeName,
                expirationDate: new Date(item.expirationDate),
                lastUpdatedDate: new Date(item.lastUpdatedDate),
                lastAccessedDate: new Date(item.lastAccessedDate),
              });
              logger.debug(`Loaded cache item from cookie: ${identifier}/${storeName}`);
            }
          }
        } catch (error) {
          logger.error(`Failed to parse cookie for key ${key}:`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
        }
      }
    }
    const duration = performance.now() - startTime;
    logger.info('Finished loading cache from cookies', { duration: `${duration.toFixed(2)}ms` });
  }

  private saveToCookies(): void {
    const startTime = performance.now();
    logger.info('Saving cache to cookies');
    for (const [identifier, storeNames] of Object.entries(this.cache)) {
      for (const [storeName, items] of Object.entries(storeNames)) {
        for (const item of items) {
          try {
            const cookieValue = encodeURIComponent(JSON.stringify(item));
            if (item.value && typeof item.value === 'object' && 'encryptedData' in item.value) {
              const encryptedValue = item.value as EncryptedValue;
              if (encryptedValue.encryptedData instanceof Uint8Array) {
                const hashArray = Array.from(encryptedValue.encryptedData.slice(0, 10))
                  .map((b) => b.toString(16).padStart(2, '0'))
                  .join('');
                const cookieKey = `${identifier}_${storeName}_${hashArray}`;
                document.cookie = `${cookieKey}=${cookieValue}; expires=${item.expirationDate.toUTCString()}; path=/`;
                logger.debug(`Saved cache item to cookie: ${identifier}/${storeName}`);
              } else {
                logger.error(`Invalid encryptedData type for ${identifier}/${storeName}`);
              }
            } else {
              logger.error(`Invalid value type for ${identifier}/${storeName}`);
            }
          } catch (error) {
            logger.error(`Failed to save cookie for ${identifier}/${storeName}:`, {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            });
          }
        }
      }
    }
    const duration = performance.now() - startTime;
    logger.info('Finished saving cache to cookies', { duration: `${duration.toFixed(2)}ms` });
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
      logger.debug('Encryption completed', { duration: `${duration.toFixed(2)}ms` });
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
          (key: string) => localStorage.getItem(key),
          (key: string, value: string) => localStorage.setItem(key, value),
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
        this.saveToCookies();
        logger.debug(`Updating last updated date for ${identifier}/${storeName}`);
        ClientLastDateModule.updateLastUpdatedDate(
          (key: string, value: string) => localStorage.setItem(key, value),
          identifier,
          storeName,
        );
        const duration = performance.now() - startTime;
        logger.info(`Cache value set successfully for ${identifier}/${storeName}`, {
          duration: `${duration.toFixed(2)}ms`,
        });
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
      const duration = performance.now() - startTime;
      logger.debug('Get operation completed (no valid items)', {
        duration: `${duration.toFixed(2)}ms`,
      });
      callback(undefined);
      return;
    }

    logger.debug(`Incrementing get hit count for ${identifier}/${storeName}`);
    HitCountModule.incrementGetHitCount(
      (key: string) => localStorage.getItem(key),
      (key: string, value: string) => localStorage.setItem(key, value),
      identifier,
      storeName,
    );

    const latestItem = validItems[validItems.length - 1];
    this.decryptValue(latestItem.value as EncryptedValue, (decryptedValue: DataValue | null) => {
      if (decryptedValue) {
        logger.debug(`Getting hit counts for ${identifier}/${storeName}`);
        const getHitCountResult = HitCountModule.getHitCounts(
          (key: string) => localStorage.getItem(key),
          identifier,
          storeName,
        );

        logger.debug(`Getting last dates for ${identifier}/${storeName}`);
        const { lastUpdatedDate, lastAccessedDate } = ClientLastDateModule.getLastDates(
          (key: string) => localStorage.getItem(key),
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
          (key: string, value: string) => localStorage.setItem(key, value),
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
    const cookiePrefix = `${identifier}_${storeName}_`;
    document.cookie.split(';').forEach((cookie) => {
      const [key] = cookie.trim().split('=');
      if (key.startsWith(cookiePrefix)) {
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        logger.debug(`Removed cookie: ${key}`);
      }
    });

    const getHitCountKey = HitCountModule.getCacheGetHitCountKey(identifier, storeName);
    const setHitCountKey = HitCountModule.getCacheSetHitCountKey(identifier, storeName);
    localStorage.removeItem(getHitCountKey);
    localStorage.removeItem(setHitCountKey);
    logger.debug(`Removed hit counts for ${identifier}/${storeName}`);

    ClientLastDateModule.updateLastDates(
      (key: string, value: string) => localStorage.setItem(key, value),
      identifier,
      storeName,
      { lastUpdatedDate: new Date(0), lastAccessedDate: new Date(0) },
    );
    logger.debug(`Reset last dates to epoch for ${identifier}/${storeName}`);

    const duration = performance.now() - startTime;
    logger.info(`Cache value removed for ${identifier}/${storeName}`, {
      duration: `${duration.toFixed(2)}ms`,
    });
  }

  clear(): void {
    const startTime = performance.now();
    logger.info('Clearing all cache values');
    this.cache = {};
    document.cookie.split(';').forEach((cookie) => {
      const [key] = cookie.trim().split('=');
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      logger.debug(`Removed cookie: ${key}`);
    });

    for (const key in localStorage) {
      if (
        key.endsWith(':getHitCount') ||
        key.endsWith(':setHitCount') ||
        key.endsWith(':lastUpdated') ||
        key.endsWith(':lastAccessed')
      ) {
        localStorage.removeItem(key);
        logger.debug(`Removed localStorage item: ${key}`);
      }
    }
    const duration = performance.now() - startTime;
    logger.info('All cache values cleared', { duration: `${duration.toFixed(2)}ms` });
  }

  updateConfig(newConfig: CookieCacheConfig, newGlobalConfig: GlobalConfig): void {
    logger.info('Updating CookieCache configuration', {
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

export function createCookieCache(
  config: CookieCacheConfig,
  globalConfig: GlobalConfig,
): CookieCache {
  return new CookieCache(config, globalConfig);
}

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    logger.error('Unhandled Rejection at:', {
      reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
    });
  });
}

export { logger as cookieCacheLogger };

export default CookieCache;
