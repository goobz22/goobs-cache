/**
 * @file SessionStorage.client.ts
 * @description Implements a client-side cache using SessionStorage with encryption, compression, and hit count tracking.
 */

'use client';

import { EncryptedValue, CacheConfig, DataValue, CacheResult } from '../types';
import { encrypt, decrypt } from '../utils/encryption.client';
import { incrementGetHitCount, incrementSetHitCount, getHitCounts } from '../utils/hitCount.client';
import {
  updateLastUpdatedDate,
  updateLastAccessedDate,
  getLastUpdatedDate,
  getLastAccessedDate,
} from '../utils/lastDate.client';
import { compressData, decompressData } from '../utils/compression.client';
import { realTimeSync } from '../utils/realTimeServerToClient';

interface CacheStructure {
  [identifier: string]: {
    [storeName: string]: CacheResult[];
  };
}

class SessionStorageCache {
  private cache: CacheStructure = {};
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.loadFromSessionStorage();
  }

  private loadFromSessionStorage(): void {
    const cacheString = sessionStorage.getItem('reusableStore');
    if (cacheString) {
      try {
        this.cache = JSON.parse(cacheString) as CacheStructure;
      } catch (error) {
        console.error('Failed to parse session cache', error);
      }
    }
  }

  private saveToSessionStorage(): void {
    try {
      const cacheString = JSON.stringify(this.cache);
      sessionStorage.setItem('reusableStore', cacheString);
    } catch (error) {
      console.error('Failed to set session cache', error);
    }
  }

  private encryptValue(value: DataValue, callback: (result: EncryptedValue | null) => void): void {
    const stringValue = JSON.stringify(value);
    const encoder = new TextEncoder();
    const dataArray = encoder.encode(stringValue);
    const compressedValue = compressData(dataArray);

    encrypt(compressedValue, this.config, (encryptedValue) => {
      callback(encryptedValue);
    });
  }

  private decryptValue(
    encryptedValue: EncryptedValue,
    callback: (result: DataValue | null) => void,
  ): void {
    decrypt(encryptedValue, this.config, (decrypted) => {
      if (decrypted) {
        const decompressedValue = decompressData(decrypted);
        if (decompressedValue instanceof Uint8Array) {
          const decompressedString = new TextDecoder().decode(decompressedValue);
          try {
            callback(JSON.parse(decompressedString) as DataValue);
          } catch (error) {
            console.warn('Failed to parse decrypted value as JSON. Returning as string.', error);
            callback(decompressedString as DataValue);
          }
        } else {
          console.warn('Decompressed value is not a Uint8Array. Returning as is.');
          callback(decompressedValue as DataValue);
        }
      } else {
        callback(null);
      }
    });
  }

  set(identifier: string, storeName: string, value: DataValue, expirationDate: Date): void {
    this.encryptValue(value, (encryptedValue) => {
      if (encryptedValue) {
        if (!this.cache[identifier]) {
          this.cache[identifier] = {};
        }
        if (!this.cache[identifier][storeName]) {
          this.cache[identifier][storeName] = [];
        }

        incrementSetHitCount(
          (key) => sessionStorage.getItem(key),
          (key, value) => sessionStorage.setItem(key, value),
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

        updateLastUpdatedDate(
          (key, value) => sessionStorage.setItem(key, value),
          identifier,
          storeName,
        );

        this.decryptValue(encryptedValue, (decryptedValue) => {
          if (decryptedValue) {
            realTimeSync.handleCacheUpdate({ ...newCacheResult, value: decryptedValue });
          }
        });
      }
    });
  }

  get(
    identifier: string,
    storeName: string,
    callback: (result: CacheResult | undefined) => void,
  ): void {
    const items = this.cache[identifier]?.[storeName] || [];
    const now = new Date();
    const validItems = items.filter((item) => item.expirationDate > now);

    if (validItems.length === 0) {
      callback(undefined);
      return;
    }

    incrementGetHitCount(
      (key) => sessionStorage.getItem(key),
      (key, value) => sessionStorage.setItem(key, value),
      identifier,
      storeName,
    );

    updateLastAccessedDate(
      (key, value) => sessionStorage.setItem(key, value),
      identifier,
      storeName,
    );

    const latestItem = validItems[validItems.length - 1];
    this.decryptValue(latestItem.value as EncryptedValue, (decryptedValue) => {
      if (decryptedValue) {
        const getHitCountResult = getHitCounts(
          (key) => sessionStorage.getItem(key),
          identifier,
          storeName,
        );
        const lastUpdatedDateResult = getLastUpdatedDate(
          (key) => sessionStorage.getItem(key),
          identifier,
          storeName,
        );
        const lastAccessedDateResult = getLastAccessedDate(
          (key) => sessionStorage.getItem(key),
          identifier,
          storeName,
        );

        callback({
          identifier,
          storeName,
          value: decryptedValue,
          expirationDate: latestItem.expirationDate,
          lastUpdatedDate: lastUpdatedDateResult,
          lastAccessedDate: lastAccessedDateResult,
          getHitCount: getHitCountResult.getHitCount,
          setHitCount: getHitCountResult.setHitCount,
        });
      } else {
        callback(undefined);
      }
    });
  }

  remove(identifier: string, storeName: string): void {
    if (this.cache[identifier]) {
      delete this.cache[identifier][storeName];
      if (Object.keys(this.cache[identifier]).length === 0) {
        delete this.cache[identifier];
      }
    }
    this.saveToSessionStorage();

    const hitCountKey = `${identifier}:${storeName}:hitCount`;
    sessionStorage.removeItem(hitCountKey);

    updateLastUpdatedDate(
      (key, value) => sessionStorage.setItem(key, value),
      identifier,
      storeName,
      new Date(0),
    );
    updateLastAccessedDate(
      (key, value) => sessionStorage.setItem(key, value),
      identifier,
      storeName,
      new Date(0),
    );

    realTimeSync.handleCacheUpdate({
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

  clear(): void {
    this.cache = {};
    sessionStorage.removeItem('reusableStore');

    for (const key in sessionStorage) {
      if (
        key.endsWith(':hitCount') ||
        key.endsWith(':lastUpdated') ||
        key.endsWith(':lastAccessed')
      ) {
        sessionStorage.removeItem(key);
      }
    }

    realTimeSync.handleCacheUpdate({
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

  subscribeToUpdates<T extends DataValue>(
    identifier: string,
    storeName: string,
    listener: (data: T | undefined) => void,
  ): () => void {
    return realTimeSync.subscribe<T>(identifier, storeName, listener);
  }
}

export default SessionStorageCache;
