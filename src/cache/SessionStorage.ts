/**
 * @file SessionStorageCache.ts
 * @description Implements a client-side cache using SessionStorage with encryption, atom-based state management, and context API.
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
import { createAtom, useAtom } from '../atom';
import { createAsyncContext } from '../context';

interface CacheStructure {
  [identifier: string]: {
    [storeName: string]: CacheItem<EncryptedValue>[];
  };
}

class SessionStorageCache {
  private cache: CacheStructure = {};
  private listeners: Record<string, Set<Listener>> = {};
  private atoms: Record<string, Atom<DataValue>> = {};
  private contexts: Record<string, AsyncContext<DataValue>> = {};
  private batchedUpdates: Set<string> = new Set();
  private isBatchingUpdates = false;
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

  private async encryptValue(value: unknown): Promise<EncryptedValue> {
    const stringValue = JSON.stringify(value);
    return await encrypt(stringValue, this.config);
  }

  private async decryptValue(encryptedValue: EncryptedValue): Promise<unknown> {
    const decrypted = await decrypt(encryptedValue, this.config);
    return JSON.parse(decrypted);
  }

  private notifyListeners(identifier: string, storeName: string): void {
    const key = `${identifier}:${storeName}`;
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
      const [identifier, storeName] = key.split(':');
      this.notifyListeners(identifier, storeName);
    });
    this.batchedUpdates.clear();
  }

  private async updateCache(
    identifier: string,
    storeName: string,
    value: unknown,
    expirationDate: Date,
  ): Promise<void> {
    const encryptedValue = await this.encryptValue(value);
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
      this.batchedUpdates.add(`${identifier}:${storeName}`);
    } else {
      this.notifyListeners(identifier, storeName);
    }
    this.saveToSessionStorage();
  }

  async getFromSessionStorage<T extends DataValue>(
    identifier: string,
    storeName: string,
  ): Promise<T[]> {
    const items = this.cache[identifier]?.[storeName] || [];
    const now = new Date();
    const validItems = items.filter((item) => new Date(item.expirationDate) > now);

    return Promise.all(
      validItems.map(async (item) => {
        item.hitCount++;
        item.lastAccessed = Date.now();
        return this.decryptValue(item.value) as Promise<T>;
      }),
    );
  }

  async setToSessionStorage<T extends DataValue>(
    identifier: string,
    storeName: string,
    value: T,
    expirationDate: Date,
  ): Promise<void> {
    await this.updateCache(identifier, storeName, value, expirationDate);
  }

  removeFromSessionStorage(identifier: string, storeName: string): void {
    if (this.cache[identifier]) {
      delete this.cache[identifier][storeName];
      if (Object.keys(this.cache[identifier]).length === 0) {
        delete this.cache[identifier];
      }
    }
    this.saveToSessionStorage();
    this.notifyListeners(identifier, storeName);
  }

  createAtom<T extends DataValue>(identifier: string, storeName: string, initialValue: T): Atom<T> {
    const key = `${identifier}:${storeName}`;
    if (!this.atoms[key]) {
      const atom = createAtom<T>(
        identifier,
        storeName,
        async () => {
          const values = await this.getFromSessionStorage<T>(identifier, storeName);
          return values.length > 0 ? values[values.length - 1] : initialValue;
        },
        async (valueOrUpdater: T | ((prev: T) => Promise<T>)) => {
          const currentValue = await atom.get();
          const newValue =
            typeof valueOrUpdater === 'function'
              ? await valueOrUpdater(currentValue)
              : valueOrUpdater;
          await this.setToSessionStorage(
            identifier,
            storeName,
            newValue,
            new Date(8640000000000000),
          );
        },
      );
      this.atoms[key] = atom as unknown as Atom<DataValue>;
      this.setToSessionStorage(identifier, storeName, initialValue, new Date(8640000000000000));
    }
    return this.atoms[key] as unknown as Atom<T>;
  }

  async select<T extends ComplexValue, R>(selector: Selector<T, R>): Promise<R> {
    const decryptPromises = Object.entries(this.cache).flatMap(([identifier, storeNames]) =>
      Object.entries(storeNames).flatMap(([storeName, items]) =>
        items.map((item) =>
          this.decryptValue(item.value).then((decryptedValue) => [
            `${identifier}:${storeName}`,
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
    const key = `${identifier}:${storeName}`;
    if (!this.contexts[key]) {
      const context = createAsyncContext<T>(
        identifier,
        storeName,
        defaultValue,
        async () => {
          const values = await this.getFromSessionStorage<T>(identifier, storeName);
          return values.length > 0 ? values[values.length - 1] : defaultValue;
        },
        async (identifier: string, value: T, expirationDate: Date, storeName: string) => {
          await this.setToSessionStorage(identifier, storeName, value, expirationDate);
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
    return this.getFromSessionStorage<T>(identifier, storeName);
  }

  async clear(): Promise<void> {
    this.cache = {};
    sessionStorage.removeItem('reusableStore');
    this.listeners = {};
    this.atoms = {};
    this.contexts = {};
    this.batchedUpdates.clear();
  }

  subscribe(identifier: string, storeName: string, listener: Listener): () => void {
    const key = `${identifier}:${storeName}`;
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
      this.getFromSessionStorage<T>(identifier, storeName).then(
        (values) => values[values.length - 1],
      );
  }

  useStateHook<T extends DataValue>(
    identifier: string,
    storeName: string,
    initialValue: T,
  ): () => UseStateHook<T> {
    return () => {
      const atom = this.createAtom(identifier, storeName, initialValue);
      return useAtom(atom);
    };
  }
}

export default SessionStorageCache;
