'use client';

import { DataValue, CacheResult } from '../types';
import { ClientLogger } from '../utils/logger.client';
import CookieUtils, { updateConfig as updateCookieConfig } from '../utils/cookie.client';

let cookieCache: CookieCache | null = null;

class CookieCache {
  constructor() {
    ClientLogger.info('Initializing CookieCache');
    this.loadFromCookies();
  }

  private async loadFromCookies(): Promise<void> {
    const startTime = performance.now();
    ClientLogger.info('Loading cache from cookies');
    // CookieUtils handles the loading internally
    const duration = performance.now() - startTime;
    ClientLogger.info('Finished loading cache from cookies', {
      duration: `${duration.toFixed(2)}ms`,
    });
  }

  async set(
    identifier: string,
    storeName: string,
    value: DataValue,
    expirationDate: Date,
  ): Promise<void> {
    const startTime = performance.now();
    ClientLogger.info(`Setting cache value for ${identifier}/${storeName}`);

    const cacheResult: CacheResult = {
      identifier,
      storeName,
      value,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 1,
    };

    await CookieUtils.setCookie(`${identifier}_${storeName}`, JSON.stringify(cacheResult), {
      expires: expirationDate,
      path: '/',
    });

    const duration = performance.now() - startTime;
    ClientLogger.info(`Cache value set successfully for ${identifier}/${storeName}`, {
      duration: `${duration.toFixed(2)}ms`,
    });
  }

  async get(identifier: string, storeName: string): Promise<CacheResult | undefined> {
    const startTime = performance.now();
    ClientLogger.info(`Getting cache value for ${identifier}/${storeName}`);

    const cookieValue = await CookieUtils.getCookie(`${identifier}_${storeName}`);

    if (cookieValue) {
      try {
        const cacheResult: CacheResult = JSON.parse(cookieValue);
        cacheResult.lastAccessedDate = new Date();
        cacheResult.getHitCount += 1;

        await this.set(identifier, storeName, cacheResult.value, cacheResult.expirationDate);

        const duration = performance.now() - startTime;
        ClientLogger.info(`Cache value retrieved successfully for ${identifier}/${storeName}`, {
          duration: `${duration.toFixed(2)}ms`,
        });

        return cacheResult;
      } catch (error) {
        ClientLogger.error(`Failed to parse cookie value for ${identifier}/${storeName}`, {
          error,
        });
      }
    }

    ClientLogger.warn(`Value not found for ${identifier}/${storeName}`);
    return undefined;
  }

  async remove(identifier: string, storeName: string): Promise<void> {
    const startTime = performance.now();
    ClientLogger.info(`Removing cache value for ${identifier}/${storeName}`);

    CookieUtils.deleteCookie(`${identifier}_${storeName}`);

    const duration = performance.now() - startTime;
    ClientLogger.info(`Cache value removed for ${identifier}/${storeName}`, {
      duration: `${duration.toFixed(2)}ms`,
    });
  }

  async clear(): Promise<void> {
    const startTime = performance.now();
    ClientLogger.info('Clearing all cache values');

    // This is a simplification. In reality, you'd need to identify and clear only the cookies set by this cache.
    document.cookie.split(';').forEach((cookie) => {
      const [key] = cookie.trim().split('=');
      CookieUtils.deleteCookie(key);
    });

    const duration = performance.now() - startTime;
    ClientLogger.info('All cache values cleared', { duration: `${duration.toFixed(2)}ms` });
  }

  updateConfig(): void {
    updateCookieConfig();
  }

  static create(): CookieCache {
    return new CookieCache();
  }
}

function initializeCookieCache(): void {
  if (!cookieCache) {
    ClientLogger.info('Creating CookieCache instance');
    cookieCache = CookieCache.create();
  }
}

function createCookieAtom(identifier: string, storeName: string) {
  initializeCookieCache();

  return {
    get: async (): Promise<CacheResult | undefined> => {
      return cookieCache!.get(identifier, storeName);
    },
    set: async (value: DataValue): Promise<void> => {
      const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
      await cookieCache!.set(identifier, storeName, value, expirationDate);
    },
    remove: async (): Promise<void> => {
      await cookieCache!.remove(identifier, storeName);
    },
  };
}

export const cookie = {
  atom: createCookieAtom,
  clear: async (): Promise<void> => {
    initializeCookieCache();
    await cookieCache!.clear();
  },
  updateConfig: (): void => {
    if (cookieCache) {
      cookieCache.updateConfig();
    } else {
      initializeCookieCache();
    }
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    ClientLogger.error('Unhandled Rejection at:', {
      reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
    });
  });
}

export default cookie;
