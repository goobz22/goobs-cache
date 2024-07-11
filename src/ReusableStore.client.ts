'use client';

import { DataValue, EncryptedValue, CacheConfig } from './types';
import CookieCache from './cache/Cookie';
import SessionStorageCache from './cache/SessionStorage';
import config from '../.reusablestore.json';

// Instantiate the CookieCache and SessionStorageCache with the imported config
const cookieCache = new CookieCache(config as CacheConfig);
const sessionStorageCache = new SessionStorageCache(config as CacheConfig);

function getValueType(value: DataValue): string {
  if (Array.isArray(value)) {
    return 'array';
  } else if (typeof value === 'object' && value !== null) {
    if ('type' in value && typeof value.type === 'string') {
      return value.type;
    }
    return 'object';
  }
  return typeof value;
}

export async function clientSet<T extends DataValue>(
  key: string,
  value: T,
  expirationDate: Date,
  cacheType: 'cookie' | 'session',
): Promise<void> {
  const stringifiedValue = JSON.stringify(value);
  const encryptedValue: EncryptedValue = {
    encryptedData: stringifiedValue,
    iv: '',
    salt: '',
    encryptionKey: '',
    type: getValueType(value),
  };

  if (cacheType === 'cookie') {
    cookieCache.setToCookie(key, encryptedValue, expirationDate);
  } else {
    sessionStorageCache.setToSessionStorage(key, encryptedValue, expirationDate);
  }
}

export async function clientGet<T extends DataValue>(
  key: string,
  cacheType: 'cookie' | 'session',
): Promise<{ value: T | null }> {
  let clientCachedItem;
  if (cacheType === 'cookie') {
    clientCachedItem = await cookieCache.getFromCookie(key);
  } else {
    clientCachedItem = await sessionStorageCache.getFromSessionStorage(key);
  }

  if (
    clientCachedItem &&
    typeof clientCachedItem === 'object' &&
    'encryptedData' in clientCachedItem
  ) {
    try {
      const parsedValue = JSON.parse(clientCachedItem.encryptedData) as T;
      return { value: parsedValue };
    } catch (parseError) {
      console.error('Error parsing cached item:', parseError);
      return { value: null };
    }
  }
  return { value: null };
}

export function clientRemove(key: string, cacheType: 'cookie' | 'session'): void {
  if (cacheType === 'cookie') {
    cookieCache.removeFromCookie(key);
  } else {
    sessionStorageCache.removeFromSessionStorage(key);
  }
}

export function createClientAtom<T extends DataValue>(
  key: string,
  initialValue: T,
  cacheType: 'cookie' | 'session',
) {
  const cache = cacheType === 'cookie' ? cookieCache : sessionStorageCache;
  return cache.createAtom(key, initialValue);
}

export function useClientContext<T extends DataValue>(
  key: string,
  defaultValue: T,
  cacheType: 'cookie' | 'session',
): Promise<T> {
  const cache = cacheType === 'cookie' ? cookieCache : sessionStorageCache;
  return cache.useContext(key) as Promise<T>;
}

export function createClientContext<T extends DataValue>(
  key: string,
  defaultValue: T,
  cacheType: 'cookie' | 'session',
) {
  const cache = cacheType === 'cookie' ? cookieCache : sessionStorageCache;
  return cache.createContext(key, defaultValue);
}

export function useClientState<T extends DataValue>(
  key: string,
  initialValue: T,
  cacheType: 'cookie' | 'session',
) {
  const cache = cacheType === 'cookie' ? cookieCache : sessionStorageCache;
  return cache.useState(key, initialValue);
}
