/**
 * @file CookieCache.ts
 * @description Implements a client-side cache using cookies with encryption, atom-based state management, and context API.
 */

'use client';

import {
  EncryptedValue,
  CacheItem,
  Listener,
  Selector,
  AsyncContext,
  UseStateHook,
  CacheConfig,
  Atom,
  DataValue,
  ComplexValue,
} from '../types';
import { encrypt, decrypt } from '../utils/Encryption.client';
import { createAtom } from '../atom';
import { createAsyncContext } from '../context';

interface CacheStructure {
  [identifier: string]: {
    [storeName: string]: CacheItem<EncryptedValue>[];
  };
}

/**
 * CookieCache class provides a client-side caching mechanism using cookies.
 * It supports encryption, atom-based state management, and context API.
 */
class CookieCache {
  private cache: CacheStructure = {};
  private listeners: Record<string, Set<Listener>> = {};
  private atoms: Record<string, Atom<DataValue>> = {};
  private contexts: Record<string, AsyncContext<DataValue>> = {};
  private batchedUpdates: Set<string> = new Set();
  private isBatchingUpdates = false;
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
              this.cache[identifier][storeName].push(item as CacheItem<EncryptedValue>);
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
            const cookieValue = encodeURIComponent(
              JSON.stringify({ identifier, storeName, ...item }),
            );
            const cookieKey = `${identifier}_${storeName}_${item.value.encryptedData.slice(0, 10)}`;
            document.cookie = `${cookieKey}=${cookieValue}; expires=${new Date(
              item.expirationDate,
            ).toUTCString()}; path=/`;
          } catch (error) {
            console.error(`Failed to save cookie for ${identifier}/${storeName}:`, error);
          }
        }
      }
    }
  }

  private encryptValue(value: DataValue, storeName: string): Promise<EncryptedValue> {
    const stringValue = JSON.stringify(value);
    return encrypt(stringValue, this.config).then((encryptedValue) => {
      return { ...encryptedValue, storeName };
    });
  }

  private decryptValue(encryptedValue: EncryptedValue): Promise<DataValue> {
    return decrypt(encryptedValue, this.config).then((decrypted) => {
      return JSON.parse(decrypted) as DataValue;
    });
  }

  private notifyListeners(identifier: string, storeName: string): void {
    const key = `${identifier}_${storeName}`;
    if (this.listeners[key]) {
      this.listeners[key].forEach((listener) => listener());
    }
  }

  private batchStart(): void {
    this.isBatchingUpdates = true;
  }

  private batchEnd(): void {
    this.isBatchingUpdates = false;
    this.batchedUpdates.forEach((key) => {
      const [identifier, storeName] = key.split('_');
      this.notifyListeners(identifier, storeName);
    });
    this.batchedUpdates.clear();
  }

  private updateCache(
    identifier: string,
    storeName: string,
    value: DataValue,
    expirationDate: Date,
  ): void {
    this.encryptValue(value, storeName).then((encryptedValue) => {
      if (!this.cache[identifier]) {
        this.cache[identifier] = {};
      }
      if (!this.cache[identifier][storeName]) {
        this.cache[identifier][storeName] = [];
      }
      this.cache[identifier][storeName].push({
        value: encryptedValue,
        lastAccessed: Date.now(),
        expirationDate,
        hitCount: 0,
        compressed: false,
        size: encryptedValue.encryptedData.length,
      });
      if (this.isBatchingUpdates) {
        this.batchedUpdates.add(`${identifier}_${storeName}`);
      } else {
        this.notifyListeners(identifier, storeName);
      }
      this.saveToCookies();
    });
  }

  getFromCookie<T extends DataValue>(identifier: string, storeName: string): Promise<T[]> {
    const items = this.cache[identifier]?.[storeName] || [];
    const now = new Date();
    const validItems = items.filter((item) => new Date(item.expirationDate) > now);

    return Promise.all(
      validItems.map((item) => {
        item.hitCount++;
        item.lastAccessed = Date.now();
        return this.decryptValue(item.value) as Promise<T>;
      }),
    );
  }

  async setToCookie<T extends DataValue>(
    identifier: string,
    storeName: string,
    value: T,
    expirationDate: Date,
  ): Promise<void> {
    await this.updateCache(identifier, storeName, value, expirationDate);
  }

  removeFromCookie(identifier: string, storeName: string): void {
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
    this.notifyListeners(identifier, storeName);
  }

  createAtom<T extends DataValue>(identifier: string, storeName: string, initialValue: T): Atom<T> {
    const key = `${identifier}_${storeName}`;
    if (!this.atoms[key]) {
      const atom = createAtom<T>(
        identifier,
        storeName,
        async () => {
          const values = await this.getFromCookie<T>(identifier, storeName);
          return values.length > 0 ? values[values.length - 1] : initialValue;
        },
        async (valueOrUpdater: T | ((prev: T) => Promise<T>)) => {
          const currentValue = await atom.get();
          const newValue =
            typeof valueOrUpdater === 'function'
              ? await valueOrUpdater(currentValue)
              : valueOrUpdater;
          await this.setToCookie(identifier, storeName, newValue, new Date(8640000000000000));
        },
      );
      this.atoms[key] = atom as unknown as Atom<DataValue>;
      this.setToCookie(identifier, storeName, initialValue, new Date(8640000000000000));
    }
    return this.atoms[key] as unknown as Atom<T>;
  }

  async select<T extends ComplexValue, R>(selector: Selector<T, R>): Promise<R> {
    const decryptPromises = Object.entries(this.cache).flatMap(([identifier, storeNames]) =>
      Object.entries(storeNames).flatMap(([storeName, items]) =>
        items.map((item) =>
          this.decryptValue(item.value).then((decryptedValue) => [
            `${identifier}_${storeName}`,
            decryptedValue,
          ]),
        ),
      ),
    );

    const decryptedEntries = await Promise.all(decryptPromises);
    const decryptedCache = Object.fromEntries(decryptedEntries) as T;
    return selector(decryptedCache);
  }

  batch(callback: () => void): void {
    this.batchStart();
    callback();
    this.batchEnd();
  }

  createContext<T extends DataValue>(
    identifier: string,
    storeName: string,
    defaultValue: T,
  ): AsyncContext<T> {
    const key = `${identifier}_${storeName}`;
    if (!this.contexts[key]) {
      const context = createAsyncContext<T>(
        identifier,
        storeName,
        defaultValue,
        async () => {
          const values = await this.getFromCookie<T>(identifier, storeName);
          return values.length > 0 ? values[values.length - 1] : defaultValue;
        },
        async (identifier: string, value: T, expirationDate: Date, storeName: string) => {
          await this.setToCookie(identifier, storeName, value, expirationDate);
        },
      );
      this.contexts[key] = context as unknown as AsyncContext<DataValue>;
    }
    return this.contexts[key] as unknown as AsyncContext<T>;
  }

  getByIdentifierAndStoreName<T extends DataValue>(
    identifier: string,
    storeName: string,
  ): Promise<T[]> {
    return this.getFromCookie<T>(identifier, storeName);
  }

  clear(): void {
    this.cache = {};
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key] = cookie.trim().split('=');
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
    this.atoms = {};
    this.contexts = {};
    this.listeners = {};
    this.batchedUpdates.clear();
  }

  subscribe(identifier: string, storeName: string, listener: Listener): () => void {
    const key = `${identifier}_${storeName}`;
    if (!this.listeners[key]) {
      this.listeners[key] = new Set();
    }
    this.listeners[key].add(listener);
    return () => {
      this.listeners[key]?.delete(listener);
      if (this.listeners[key]?.size === 0) {
        delete this.listeners[key];
      }
    };
  }

  // New methods to be used in functional components
  useContextHook<T extends DataValue>(
    identifier: string,
    storeName: string,
  ): () => Promise<T | undefined> {
    return () =>
      this.getFromCookie<T>(identifier, storeName).then((values) => values[values.length - 1]);
  }

  useStateHook<T extends DataValue>(
    identifier: string,
    storeName: string,
    initialValue: T,
  ): () => UseStateHook<T> {
    return () => {
      const atom = this.createAtom(identifier, storeName, initialValue);
      const [state, setState] = (() => {
        let currentState: T | undefined;
        return [
          () => currentState,
          async (value: T | ((prev: T) => Promise<T>)) => {
            const newValue =
              typeof value === 'function'
                ? await (value as (prev: T) => Promise<T>)(currentState as T)
                : value;
            currentState = newValue;
            await atom.set(newValue);
          },
        ];
      })();

      atom.get().then((value) => {
        if (value !== undefined) {
          setState(value);
        }
      });

      return [state(), setState];
    };
  }
}

export default CookieCache;
