'use client';

import { GlobalConfig } from '../types';
import { ClientLogger } from 'goobs-testing';
import CookieUtils from '../utils/cookie.client';

interface CacheResult<T> {
  identifier: string;
  storeName: string;
  value: T;
  expirationDate: Date;
  lastUpdatedDate: Date;
  lastAccessedDate: Date;
  getHitCount: number;
  setHitCount: number;
}

const defaultGlobalConfig: Pick<GlobalConfig, 'loggingEnabled' | 'logLevel' | 'logDirectory'> = {
  loggingEnabled: true,
  logLevel: 'debug',
  logDirectory: 'logs',
};

export const CookieClientModule = {
  globalConfig: defaultGlobalConfig,

  initialize(encryptionPassword?: string) {
    ClientLogger.info('Initializing CookieClientModule');
    CookieUtils.initialize(encryptionPassword);
    ClientLogger.info('CookieClientModule initialized');
  },

  set<T>(identifier: string, storeName: string, value: T, expirationDate: Date) {
    const startTime = performance.now();
    ClientLogger.info(`Setting cache value for ${identifier}/${storeName}`);

    try {
      const cacheResult: CacheResult<T> = {
        identifier,
        storeName,
        value,
        expirationDate,
        lastUpdatedDate: new Date(),
        lastAccessedDate: new Date(),
        getHitCount: 0,
        setHitCount: 1,
      };

      CookieUtils.setCookie(`${identifier}_${storeName}`, JSON.stringify(cacheResult), {
        expires: expirationDate,
        path: '/',
        secure: true,
        sameSite: 'strict',
      });

      const duration = performance.now() - startTime;
      ClientLogger.info(`Cache value set successfully for ${identifier}/${storeName}`, {
        duration: `${duration.toFixed(2)}ms`,
      });
    } catch (error) {
      ClientLogger.error(`Failed to set cache value for ${identifier}/${storeName}`, { error });
      throw new Error(`Failed to set cache value: ${error}`);
    }
  },

  get<T>(identifier: string, storeName: string): CacheResult<T> | undefined {
    const startTime = performance.now();
    ClientLogger.info(`Getting cache value for ${identifier}/${storeName}`);

    try {
      const cookieKey = `${identifier}_${storeName}`;
      const cookieValue = CookieUtils.getCookie<string>(cookieKey);

      if (cookieValue) {
        const cacheResult: CacheResult<T> = JSON.parse(cookieValue);

        if (new Date(cacheResult.expirationDate) < new Date()) {
          this.remove(identifier, storeName);
          ClientLogger.info(`Cache value expired for ${identifier}/${storeName}`);
          return undefined;
        }

        cacheResult.lastAccessedDate = new Date();
        cacheResult.getHitCount += 1;

        this.set(identifier, storeName, cacheResult.value, new Date(cacheResult.expirationDate));

        const duration = performance.now() - startTime;
        ClientLogger.info(`Cache value retrieved successfully for ${identifier}/${storeName}`, {
          duration: `${duration.toFixed(2)}ms`,
        });

        return cacheResult;
      }

      ClientLogger.warn(`Value not found for ${identifier}/${storeName}`);
      return undefined;
    } catch (error) {
      ClientLogger.error(`Failed to get cache value for ${identifier}/${storeName}`, { error });
      return undefined;
    }
  },

  remove(identifier: string, storeName: string) {
    const startTime = performance.now();
    ClientLogger.info(`Removing cache value for ${identifier}/${storeName}`);

    try {
      CookieUtils.deleteCookie(`${identifier}_${storeName}`);

      const duration = performance.now() - startTime;
      ClientLogger.info(`Cache value removed for ${identifier}/${storeName}`, {
        duration: `${duration.toFixed(2)}ms`,
      });
    } catch (error) {
      ClientLogger.error(`Failed to remove cache value for ${identifier}/${storeName}`, { error });
      throw new Error(`Failed to remove cache value: ${error}`);
    }
  },

  clear() {
    const startTime = performance.now();
    ClientLogger.info('Clearing all cache values');

    try {
      const cookies = document.cookie.split(';');

      for (const cookie of cookies) {
        const [key] = cookie.trim().split('=');
        if (key.includes('_')) {
          // Only clear cookies set by this module
          CookieUtils.deleteCookie(key);
        }
      }

      const duration = performance.now() - startTime;
      ClientLogger.info('All cache values cleared', { duration: `${duration.toFixed(2)}ms` });
    } catch (error) {
      ClientLogger.error('Failed to clear all cache values', { error });
      throw new Error(`Failed to clear cache values: ${error}`);
    }
  },

  updateConfig(
    newGlobalConfig?: Partial<Pick<GlobalConfig, 'loggingEnabled' | 'logLevel' | 'logDirectory'>>,
    newEncryptionPassword?: string,
  ) {
    ClientLogger.debug('Updating configuration');
    if (newGlobalConfig) {
      this.globalConfig = { ...this.globalConfig, ...newGlobalConfig };
    }
    CookieUtils.updateConfig(undefined, this.globalConfig, newEncryptionPassword);
    ClientLogger.info('CookieClientModule configuration updated');
  },

  createAtom<T>(identifier: string, storeName: string) {
    return {
      get: () => this.get<T>(identifier, storeName),
      set: (value: T) => {
        const expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
        this.set<T>(identifier, storeName, value, expirationDate);
      },
      remove: () => this.remove(identifier, storeName),
    };
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

// Initialize the module without encryption by default
CookieClientModule.initialize();

export default CookieClientModule;
