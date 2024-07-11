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
  Context,
  AsyncContext,
  UseStateHook,
  CacheConfig,
  Atom,
} from '../types';
import { encrypt, decrypt } from '../utils/Encryption.client';
import { createAtom, useAtom } from '../atom';
import { createAsyncContext, useAsyncContext } from './context';

/**
 * CookieCache class provides a client-side caching mechanism using cookies.
 * It supports encryption, atom-based state management, and context API.
 */
class CookieCache {
  private cache: Record<string, CacheItem<EncryptedValue>> = {};
  private listeners: Record<string, Set<Listener>> = {};
  private atoms: Record<string, Atom<any>> = {};
  private contexts: Record<string, Context<any> | AsyncContext<any>> = {};
  private batchedUpdates: Set<string> = new Set();
  private isBatchingUpdates = false;
  private config: CacheConfig;

  /**
   * Creates an instance of CookieCache.
   * @param {CacheConfig} config - The configuration for the cache.
   */
  constructor(config: CacheConfig) {
    this.config = config;
    this.loadFromCookies();
  }

  /**
   * Loads cached items from cookies into the internal cache.
   * @private
   */
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

  /**
   * Saves the current cache state to cookies.
   * @private
   */
  private saveToCookies() {
    for (const [key, item] of Object.entries(this.cache)) {
      const cookieValue = encodeURIComponent(JSON.stringify(item));
      document.cookie = `${key}=${cookieValue}; expires=${new Date(item.expirationDate).toUTCString()}; path=/`;
    }
  }

  /**
   * Encrypts a value.
   * @private
   * @param {any} value - The value to encrypt.
   * @returns {Promise<EncryptedValue>} A promise that resolves to the encrypted value.
   */
  private encryptValue(value: any): Promise<EncryptedValue> {
    const stringValue = JSON.stringify(value);
    return encrypt(stringValue, this.config);
  }

  /**
   * Decrypts an encrypted value.
   * @private
   * @param {EncryptedValue} encryptedValue - The encrypted value to decrypt.
   * @returns {Promise<any>} A promise that resolves to the decrypted value.
   */
  private decryptValue(encryptedValue: EncryptedValue): Promise<any> {
    return decrypt(encryptedValue, this.config).then((decrypted) => {
      return JSON.parse(decrypted);
    });
  }

  /**
   * Notifies listeners of changes to a specific key.
   * @private
   * @param {string} key - The key that changed.
   */
  private notifyListeners(key: string) {
    if (this.listeners[key]) {
      this.listeners[key].forEach((listener) => listener());
    }
  }

  /**
   * Starts a batch update.
   * @private
   */
  private batchStart() {
    this.isBatchingUpdates = true;
  }

  /**
   * Ends a batch update and notifies listeners.
   * @private
   */
  private batchEnd() {
    this.isBatchingUpdates = false;
    this.batchedUpdates.forEach((key) => this.notifyListeners(key));
    this.batchedUpdates.clear();
  }

  /**
   * Updates the cache with a new value for a key.
   * @private
   * @param {string} key - The key to update.
   * @param {any} value - The new value.
   * @param {Date} expirationDate - The expiration date for the cached item.
   */
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

  /**
   * Retrieves a value from the cookie cache.
   * @param {string} key - The key to retrieve.
   * @returns {Promise<any | undefined>} A promise that resolves to the value or undefined if not found.
   */
  getFromCookie(key: string): Promise<any | undefined> {
    const item = this.cache[key];
    if (item && new Date(item.expirationDate) > new Date()) {
      item.hitCount++;
      item.lastAccessed = Date.now();
      return this.decryptValue(item.value);
    }
    return Promise.resolve(undefined);
  }

  /**
   * Sets a value in the cookie cache.
   * @param {string} key - The key to set.
   * @param {any} value - The value to set.
   * @param {Date} expirationDate - The expiration date for the cached item.
   */
  setToCookie(key: string, value: any, expirationDate: Date): void {
    this.updateCache(key, value, expirationDate);
  }

  /**
   * Removes a value from the cookie cache.
   * @param {string} key - The key to remove.
   */
  removeFromCookie(key: string): void {
    delete this.cache[key];
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    this.notifyListeners(key);
  }

  /**
   * Creates an atom for a specific key in the cache.
   * @template T
   * @param {string} key - The key for the atom.
   * @param {T} initialValue - The initial value for the atom.
   * @returns {Atom<T>} The created atom.
   */
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

  /**
   * Selects data from the cache using a selector function.
   * @template T, R
   * @param {Selector<T>} selector - The selector function to apply to the cache.
   * @returns {Promise<R>} A promise that resolves to the selected data.
   */
  select<T, R>(selector: Selector<T>): Promise<R> {
    const decryptPromises = Object.entries(this.cache).map(([key, item]) => {
      return this.decryptValue(item.value).then((decryptedValue) => [key, decryptedValue]);
    });

    return Promise.all(decryptPromises).then((decryptedEntries) => {
      const decryptedCache = Object.fromEntries(decryptedEntries) as unknown as T;
      return selector(decryptedCache);
    });
  }

  /**
   * Performs a batch update on the cache.
   * @param {() => void} callback - The callback function to execute in the batch.
   */
  batch(callback: () => void) {
    this.batchStart();
    callback();
    this.batchEnd();
  }

  /**
   * Creates an async context for a specific key in the cache.
   * @template T
   * @param {string} key - The key for the context.
   * @param {T} defaultValue - The default value for the context.
   * @returns {AsyncContext<T>} The created async context.
   */
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

  /**
   * Uses an async context for a specific key in the cache.
   * @template T
   * @param {string} key - The key for the context.
   * @returns {Promise<T>} A promise that resolves to the context value.
   */
  useContext<T>(key: string): Promise<T> {
    return useAsyncContext(key, (k) => this.getFromCookie(k));
  }

  /**
   * Creates a useState-like hook for a specific key in the cache.
   * @template T
   * @param {string} key - The key for the state.
   * @param {T} initialValue - The initial value for the state.
   * @returns {UseStateHook<T>} A useState-like hook for the cached value.
   */
  useState<T>(key: string, initialValue: T): UseStateHook<T> {
    const atom = this.createAtom(key, initialValue);
    return useAtom(atom);
  }
}

export default CookieCache;
