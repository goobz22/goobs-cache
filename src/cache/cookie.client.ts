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

class CookieCache {
  private cache: CacheStructure = {};
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.loadFromCookies();
  }

  private loadFromCookies(): void {
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
      const [key, value] = cookie.split('=');
      if (key && value) {
        try {
          const decodedValue = decodeURIComponent(value);
          if (decodedValue) {
            const parsedValue = JSON.parse(decodedValue);
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
              this.cache[identifier][storeName].push(item as CacheResult);
            }
          }
        } catch (error) {
          console.error(`Failed to parse cookie for key ${key}:`, error);
        }
      }
    }
  }

  private saveToCookies(): void {
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
                document.cookie = `${cookieKey}=${cookieValue}; expires=${new Date(
                  item.expirationDate,
                ).toUTCString()}; path=/`;
              } else {
                console.error(`Invalid encryptedData type for ${identifier}/${storeName}`);
              }
            } else {
              console.error(`Invalid value type for ${identifier}/${storeName}`);
            }
          } catch (error) {
            console.error(`Failed to save cookie for ${identifier}/${storeName}:`, error);
          }
        }
      }
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
        try {
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
        } catch (error) {
          console.error('Error during decompression:', error);
          callback(null);
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
          (key) => localStorage.getItem(key),
          (key, value) => localStorage.setItem(key, value),
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
        updateLastUpdatedDate(
          (key, value) => localStorage.setItem(key, value),
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
      (key) => localStorage.getItem(key),
      (key, value) => localStorage.setItem(key, value),
      identifier,
      storeName,
    );

    updateLastAccessedDate((key, value) => localStorage.setItem(key, value), identifier, storeName);

    const latestItem = validItems[validItems.length - 1];
    this.decryptValue(latestItem.value as EncryptedValue, (decryptedValue) => {
      if (decryptedValue) {
        const getHitCountResult = getHitCounts(
          (key) => localStorage.getItem(key),
          identifier,
          storeName,
        );
        const lastUpdatedDateResult = getLastUpdatedDate(
          (key) => localStorage.getItem(key),
          identifier,
          storeName,
        );
        const lastAccessedDateResult = getLastAccessedDate(
          (key) => localStorage.getItem(key),
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
    const cookiePrefix = `${identifier}_${storeName}_`;
    document.cookie.split(';').forEach((cookie) => {
      const [key] = cookie.trim().split('=');
      if (key.startsWith(cookiePrefix)) {
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });

    const hitCountKey = `${identifier}:${storeName}:hitCount`;
    localStorage.removeItem(hitCountKey);

    updateLastUpdatedDate(
      (key, value) => localStorage.setItem(key, value),
      identifier,
      storeName,
      new Date(0),
    );
    updateLastAccessedDate(
      (key, value) => localStorage.setItem(key, value),
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
    document.cookie.split(';').forEach((cookie) => {
      const [key] = cookie.trim().split('=');
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    for (const key in localStorage) {
      if (
        key.endsWith(':hitCount') ||
        key.endsWith(':lastUpdated') ||
        key.endsWith(':lastAccessed')
      ) {
        localStorage.removeItem(key);
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

export default CookieCache;
