'use client';

import { ClientLogger } from 'goobs-testing';
import { GlobalConfig, SessionCacheConfig } from '../types';
import ClientConfigModule from './loadConfig.client';
import {
  CompressionModule,
  createCompressionModule,
  initializeCompressionLogger,
} from './compression.client';
import {
  EncryptionModule,
  createEncryptionModule,
  initializeEncryptionLogger,
} from './encryption.client';
import HitCountModule from './hitCount.client';
import ClientLastDateModule from './lastDate.client';

let globalConfig: GlobalConfig | undefined;
let sessionConfig: SessionCacheConfig | undefined;
let encryptionModule: EncryptionModule | undefined;
let compressionModule: CompressionModule | undefined;

function initializeModules() {
  ClientLogger.debug('Initializing modules');
  if (!globalConfig || !sessionConfig) {
    ClientLogger.debug('Fetching configuration');
    const config = ClientConfigModule.getConfig();
    globalConfig = config.global;
    sessionConfig = config.session;

    ClientLogger.debug('Initializing loggers', { globalConfig });
    ClientLogger.initializeLogger(globalConfig);
    initializeEncryptionLogger(globalConfig);
    initializeCompressionLogger(globalConfig);

    ClientLogger.debug('Creating encryption and compression modules', { sessionConfig });
    encryptionModule = createEncryptionModule(sessionConfig.encryption, globalConfig);
    compressionModule = createCompressionModule(sessionConfig.compression, globalConfig);

    HitCountModule.initializeLogger(globalConfig);
    ClientLastDateModule.initializeLogger(globalConfig);

    ClientLogger.debug('Modules initialized successfully');
  } else {
    ClientLogger.debug('Modules already initialized');
  }
}

export const CookieUtils = {
  getCookie: async (name: string): Promise<string | undefined> => {
    ClientLogger.debug('Getting cookie', { name });
    initializeModules();
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${name}=`))
      ?.split('=')[1];

    if (cookieValue) {
      ClientLogger.debug('Cookie found', { name });
      try {
        ClientLogger.debug('Parsing cookie value', { name });
        const parsedValue = JSON.parse(decodeURIComponent(cookieValue));
        return new Promise((resolve) => {
          if (encryptionModule) {
            ClientLogger.debug('Decrypting cookie value', { name });
            encryptionModule.decrypt(parsedValue, (decrypted) => {
              if (decrypted && compressionModule) {
                ClientLogger.debug('Decompressing cookie value', { name });
                const decompressed = compressionModule.decompressData(decrypted, 'string');
                ClientLogger.debug('Incrementing get hit count', { name });
                HitCountModule.incrementGetHitCount(
                  (k) => localStorage.getItem(k),
                  (k, v) => localStorage.setItem(k, v),
                  name,
                  'cookie',
                );
                ClientLogger.debug('Updating last accessed date', { name });
                ClientLastDateModule.updateLastAccessedDate(
                  (k, v) => localStorage.setItem(k, v),
                  name,
                  'cookie',
                );
                const result = JSON.parse(decompressed as string);
                ClientLogger.debug('Cookie retrieved successfully', { name, result });
                resolve(result);
              } else {
                ClientLogger.warn('Decryption or decompression failed', { name });
                resolve(undefined);
              }
            });
          } else {
            ClientLogger.error('Encryption module not initialized', { name });
            resolve(undefined);
          }
        });
      } catch (error) {
        ClientLogger.error(`Failed to parse cookie value for ${name}`, { error });
        return undefined;
      }
    }
    ClientLogger.debug('Cookie not found', { name });
    return undefined;
  },

  setCookie: async (
    name: string,
    value: string,
    options: {
      expires?: Date;
      maxAge?: number;
      domain?: string;
      path?: string;
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: 'strict' | 'lax' | 'none';
    } = {},
  ): Promise<void> => {
    ClientLogger.debug('Setting cookie', { name, value, options });
    initializeModules();
    return new Promise((resolve) => {
      const stringValue = JSON.stringify(value);
      if (compressionModule && encryptionModule) {
        ClientLogger.debug('Compressing cookie value', { name });
        const compressed = compressionModule.compressData(stringValue);
        ClientLogger.debug('Encrypting compressed cookie value', { name });
        encryptionModule.encrypt(compressed, (encrypted) => {
          const cookieValue = encodeURIComponent(JSON.stringify(encrypted));
          let cookieString = `${name}=${cookieValue}`;

          if (options.expires) cookieString += `; expires=${options.expires.toUTCString()}`;
          if (options.maxAge) cookieString += `; max-age=${options.maxAge}`;
          if (options.domain) cookieString += `; domain=${options.domain}`;
          if (options.path) cookieString += `; path=${options.path}`;
          if (options.secure) cookieString += '; secure';
          if (options.httpOnly) cookieString += '; httponly';
          if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;

          ClientLogger.debug('Setting document.cookie', { name, cookieString });
          document.cookie = cookieString;

          ClientLogger.debug('Incrementing set hit count', { name });
          HitCountModule.incrementSetHitCount(
            (k) => localStorage.getItem(k),
            (k, v) => localStorage.setItem(k, v),
            name,
            'cookie',
          );
          ClientLogger.debug('Updating last dates', { name });
          ClientLastDateModule.updateLastDates(
            (k, v) => localStorage.setItem(k, v),
            name,
            'cookie',
            {
              lastUpdatedDate: new Date(),
              lastAccessedDate: new Date(),
            },
          );
          ClientLogger.debug(`Cookie ${name} set successfully`, { value });
          resolve();
        });
      } else {
        ClientLogger.error('Compression or encryption module not initialized', { name });
        resolve();
      }
    });
  },

  deleteCookie: (name: string): void => {
    ClientLogger.debug(`Deleting cookie ${name}`);
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    ClientLogger.debug(`Cookie ${name} deleted`);
  },

  hasConsentCookie: async (): Promise<boolean> => {
    ClientLogger.debug('Checking for consent cookie');
    const consentCookie = await CookieUtils.getCookie('cookie_consent');
    const hasConsent = consentCookie === 'true';
    ClientLogger.debug('Consent cookie check result', { hasConsent });
    return hasConsent;
  },

  setConsentCookie: async (consent: boolean): Promise<void> => {
    ClientLogger.debug('Setting consent cookie', { consent });
    await CookieUtils.setCookie('cookie_consent', consent.toString(), {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/',
      secure: true,
      sameSite: 'strict',
    });
    ClientLogger.debug('Consent cookie set successfully', { consent });
  },
};

export function updateConfig(): void {
  ClientLogger.debug('Updating configuration');
  globalConfig = undefined;
  sessionConfig = undefined;
  encryptionModule = undefined;
  compressionModule = undefined;
  ClientLogger.debug('Configuration reset, reinitializing modules');
  initializeModules();
  ClientLogger.debug('Configuration update complete');
}

if (typeof window !== 'undefined') {
  ClientLogger.debug('Setting up unhandled rejection handler for browser environment');
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    ClientLogger.error('Unhandled Rejection at:', {
      reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
    });
  });
  ClientLogger.debug('Unhandled rejection handler set up successfully');
}

// Module initialization
ClientLogger.debug('CookieUtils module loaded, performing initial initialization');
initializeModules();
ClientLogger.debug('CookieUtils module initialization complete');

export default CookieUtils;
