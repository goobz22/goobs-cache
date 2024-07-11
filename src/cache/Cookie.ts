'use client';

import {
  EncryptedValue,
  CacheItem,
  Listener,
  Selector,
  Context,
  AsyncContext,
  UseStateHook,
  CacheConfig,
  Atom,
} from '../types';
import { encrypt, decrypt } from '../utils/Encryption.client';
import { createAtom, useAtom } from '../atom';
import { createAsyncContext, useAsyncContext } from './context';

class CookieCache {
  private cache: Record<string, CacheItem<EncryptedValue>> = {};
  private listeners: Record<string, Set<Listener>> = {};
  private atoms: Record<string, Atom<any>> = {};
  private contexts: Record<string, Context<any> | AsyncContext<any>> = {};
  private batchedUpdates: Set<string> = new Set();
  private isBatchingUpdates = false;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.loadFromCookies();
  }

  private loadFromCookies() {
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
      const [key, value] = cookie.split('=');
      try {
        const parsedValue = JSON.parse(decodeURIComponent(value));
        this.cache[key] = parsedValue as CacheItem<EncryptedValue>;
      } catch (error) {
        console.error('Failed to parse cookie', key, error);
      }
    }
  }

  private saveToCookies() {
    for (const [key, item] of Object.entries(this.cache)) {
      const cookieValue = encodeURIComponent(JSON.stringify(item));
      document.cookie = `${key}=${cookieValue}; expires=${new Date(item.expirationDate).toUTCString()}; path=/`;
    }
  }

  private encryptValue(value: any): Promise<EncryptedValue> {
    const stringValue = JSON.stringify(value);
    return encrypt(stringValue, this.config);
  }

  private decryptValue(encryptedValue: EncryptedValue): Promise<any> {
    return decrypt(encryptedValue, this.config).then((decrypted) => {
      return JSON.parse(decrypted);
    });
  }

  private notifyListeners(key: string) {
    if (this.listeners[key]) {
      this.listeners[key].forEach((listener) => listener());
    }
  }

  private batchStart() {
    this.isBatchingUpdates = true;
  }

  private batchEnd() {
    this.isBatchingUpdates = false;
    this.batchedUpdates.forEach((key) => this.notifyListeners(key));
    this.batchedUpdates.clear();
  }

  private updateCache(key: string, value: any, expirationDate: Date) {
    this.encryptValue(value).then((encryptedValue) => {
      this.cache[key] = {
        value: encryptedValue,
        lastAccessed: Date.now(),
        expirationDate,
        hitCount: 0,
        compressed: false,
        size: encryptedValue.encryptedData.length,
      };
      if (this.isBatchingUpdates) {
        this.batchedUpdates.add(key);
      } else {
        this.notifyListeners(key);
      }
      this.saveToCookies();
    });
  }

  getFromCookie(key: string): Promise<any | undefined> {
    const item = this.cache[key];
    if (item && new Date(item.expirationDate) > new Date()) {
      item.hitCount++;
      item.lastAccessed = Date.now();
      return this.decryptValue(item.value);
    }
    return Promise.resolve(undefined);
  }

  setToCookie(key: string, value: any, expirationDate: Date): void {
    this.updateCache(key, value, expirationDate);
  }

  removeFromCookie(key: string): void {
    delete this.cache[key];
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    this.notifyListeners(key);
  }

  createAtom<T>(key: string, initialValue: T): Atom<T> {
    if (!this.atoms[key]) {
      const atom = createAtom<T>(
        key,
        () => {
          const item = this.cache[key];
          return item?.value as unknown as T;
        },
        (valueOrUpdater: T | ((prev: T) => T)) => {
          const currentValue = this.atoms[key].get();
          const newValue =
            typeof valueOrUpdater === 'function'
              ? (valueOrUpdater as (prev: T) => T)(currentValue)
              : valueOrUpdater;
          this.setToCookie(key, newValue, new Date(8640000000000000));
        },
      );
      this.atoms[key] = atom;
      this.setToCookie(key, initialValue, new Date(8640000000000000));
    }
    return this.atoms[key] as Atom<T>;
  }

  select<T, R>(selector: Selector<T>): Promise<R> {
    const decryptPromises = Object.entries(this.cache).map(([key, item]) => {
      return this.decryptValue(item.value).then((decryptedValue) => [key, decryptedValue]);
    });

    return Promise.all(decryptPromises).then((decryptedEntries) => {
      const decryptedCache = Object.fromEntries(decryptedEntries) as unknown as T;
      return selector(decryptedCache);
    });
  }

  batch(callback: () => void) {
    this.batchStart();
    callback();
    this.batchEnd();
  }

  createContext<T>(key: string, defaultValue: T): AsyncContext<T> {
    if (!this.contexts[key]) {
      this.contexts[key] = createAsyncContext<T>(
        key,
        defaultValue,
        async (k) => {
          const value = await this.getFromCookie(k);
          return value !== undefined ? value : defaultValue;
        },
        (k, v, e) => this.setToCookie(k, v, e),
      );
    }
    return this.contexts[key] as AsyncContext<T>;
  }

  useContext<T>(key: string): Promise<T> {
    return useAsyncContext(key, (k) => this.getFromCookie(k));
  }

  useState<T>(key: string, initialValue: T): UseStateHook<T> {
    const atom = this.createAtom(key, initialValue);
    return useAtom(atom);
  }
}

export default CookieCache;
