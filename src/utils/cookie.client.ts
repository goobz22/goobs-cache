'use client';

import { ClientLogger } from 'goobs-testing';
import { ClientEncryptionModule, EncryptedData } from 'goobs-encryption';
import { ClientCompressionModule as ClientCompressionModuleImport } from './compression.client';
import { GlobalConfig } from '../types';
import HitCountModule from './hitCount.client';
import ClientLastDateModule from './lastDate.client';

// Extend the ClientCompressionModule type with an initialize method
const ClientCompressionModule: typeof ClientCompressionModuleImport & {
  initialize: (compression: { compressionLevel: number }, globalConfig: GlobalConfig) => void;
} = {
  ...ClientCompressionModuleImport,
  initialize: () => {}, // Add a no-op initialize method if it doesn't exist
};

interface SessionConfig {
  cacheSize: number;
  cacheMaxAge: number;
  compression: {
    compressionLevel: number;
  };
}

const defaultSessionConfig: SessionConfig = {
  cacheSize: 5000,
  cacheMaxAge: 1800000,
  compression: {
    compressionLevel: -1,
  },
};

const defaultGlobalConfig: GlobalConfig = {
  keySize: 256,
  batchSize: 100,
  autoTuneInterval: 3600000,
  loggingEnabled: true,
  logLevel: 'debug',
  logDirectory: 'logs',
  initialize: (config: Partial<GlobalConfig>) => {
    Object.assign(defaultGlobalConfig, config);
  },
};

export const CookieUtils = {
  globalConfig: defaultGlobalConfig,
  sessionConfig: defaultSessionConfig,
  encryptionPassword: undefined as string | undefined,

  initialize(encryptionPassword?: string): void {
    ClientLogger.debug('Initializing CookieUtils');
    this.encryptionPassword = encryptionPassword;

    ClientLogger.debug('Initializing loggers', { globalConfig: this.globalConfig });
    this.globalConfig.initialize(this.globalConfig);
    ClientLogger.initializeLogger(this.globalConfig);

    if (this.encryptionPassword) {
      ClientLogger.debug('Initializing encryption module');
      ClientEncryptionModule.initialize(this.encryptionPassword, this.globalConfig);
    } else {
      ClientLogger.debug('Encryption disabled: No encryption password provided');
    }

    ClientCompressionModule.initialize(this.sessionConfig.compression, this.globalConfig);

    ClientLogger.debug('CookieUtils initialized successfully');
  },

  getCookie<T>(name: string): T | undefined {
    ClientLogger.debug('Getting cookie', { name });
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${name}=`))
      ?.split('=')[1];

    if (cookieValue) {
      ClientLogger.debug('Cookie found', { name, cookieValueLength: cookieValue.length });
      try {
        ClientLogger.debug('Parsing cookie value', { name });
        let parsedValue = JSON.parse(decodeURIComponent(cookieValue));
        ClientLogger.debug('Cookie value parsed successfully', {
          name,
          parsedValueType: typeof parsedValue,
        });

        if (this.encryptionPassword) {
          ClientLogger.debug('Decrypting cookie value', { name });
          let decrypted: T | null = null;
          ClientEncryptionModule.decrypt<T>(parsedValue, (result) => {
            decrypted = result;
          });
          if (decrypted) {
            parsedValue = decrypted;
          } else {
            ClientLogger.warn('Decryption failed, using parsed (potentially unencrypted) value', {
              name,
            });
            return undefined;
          }
        }

        ClientLogger.debug('Decompressing cookie value', { name });
        const decompressed = ClientCompressionModule.decompressData(parsedValue);
        if (decompressed === null) {
          ClientLogger.warn('Decompression failed', { name });
          return undefined;
        }

        ClientLogger.debug('Cookie value decompressed successfully', {
          name,
          decompressedLength: decompressed.length,
        });

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

        const result = JSON.parse(decompressed as string) as T;
        ClientLogger.debug('Cookie retrieved successfully', {
          name,
          resultType: typeof result,
        });
        return result;
      } catch (error) {
        ClientLogger.error(`Failed to parse cookie value for ${name}`, { error });
        return undefined;
      }
    } else {
      ClientLogger.debug('Cookie not found', { name });
      return undefined;
    }
  },

  setCookie<T>(
    name: string,
    value: T,
    options: {
      expires?: Date;
      maxAge?: number;
      domain?: string;
      path?: string;
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: 'strict' | 'lax' | 'none';
    } = {},
  ): void {
    ClientLogger.debug('Setting cookie', {
      name,
      valueType: typeof value,
      options,
    });

    const stringValue = JSON.stringify(value);
    ClientLogger.debug('Value stringified', { name, stringLength: stringValue.length });

    ClientLogger.debug('Compressing cookie value', { name });
    const compressed = ClientCompressionModule.compressData(stringValue);

    if (compressed === null) {
      ClientLogger.error('Compression failed', { name });
      return;
    }

    ClientLogger.debug('Compression result', {
      name,
      compressed: compressed.compressed,
      originalLength: stringValue.length,
      compressedLength: compressed.data.length,
    });

    let cookieValue: string;
    if (this.encryptionPassword) {
      ClientLogger.debug('Encrypting compressed cookie value', { name });
      let encrypted: EncryptedData<typeof compressed.data> | null = null;
      ClientEncryptionModule.encrypt<typeof compressed.data>(compressed.data, (result) => {
        encrypted = result;
      });
      if (encrypted) {
        cookieValue = encodeURIComponent(JSON.stringify(encrypted));
        ClientLogger.debug('Encryption successful', { name, encryptedLength: cookieValue.length });
      } else {
        ClientLogger.error('Encryption failed', { name });
        return;
      }
    } else {
      cookieValue = encodeURIComponent(compressed.data.toString());
      ClientLogger.debug('Storing unencrypted compressed value', {
        name,
        valueLength: cookieValue.length,
      });
    }

    let cookieString = `${name}=${cookieValue}`;

    if (options.expires) cookieString += `; expires=${options.expires.toUTCString()}`;
    if (options.maxAge) cookieString += `; max-age=${options.maxAge}`;
    if (options.domain) cookieString += `; domain=${options.domain}`;
    if (options.path) cookieString += `; path=${options.path}`;
    if (options.secure) cookieString += '; secure';
    if (options.httpOnly) cookieString += '; httponly';
    if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;

    ClientLogger.debug('Setting document.cookie', {
      name,
      cookieStringLength: cookieString.length,
    });
    document.cookie = cookieString;

    ClientLogger.debug('Incrementing set hit count', { name });
    HitCountModule.incrementSetHitCount(
      (k) => localStorage.getItem(k),
      (k, v) => localStorage.setItem(k, v),
      name,
      'cookie',
    );

    ClientLogger.debug('Updating last dates', { name });
    ClientLastDateModule.updateLastDates((k, v) => localStorage.setItem(k, v), name, 'cookie', {
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
    });

    ClientLogger.debug(`Cookie ${name} set successfully`);
  },

  deleteCookie(name: string): void {
    ClientLogger.debug(`Deleting cookie ${name}`);
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    ClientLogger.debug(`Cookie ${name} deleted`);
  },

  hasConsentCookie(): boolean {
    ClientLogger.debug('Checking for consent cookie');
    const consentCookie = this.getCookie<string>('cookie_consent');
    const hasConsent = consentCookie === 'true';
    ClientLogger.debug('Consent cookie check result', { hasConsent });
    return hasConsent;
  },

  setConsentCookie(consent: boolean): void {
    ClientLogger.debug('Setting consent cookie', { consent });
    this.setCookie<string>('cookie_consent', consent.toString(), {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/',
      secure: true,
      sameSite: 'strict',
    });
    ClientLogger.debug('Consent cookie set successfully', { consent });
  },

  updateConfig(
    newSessionConfig?: Partial<SessionConfig>,
    newGlobalConfig?: Partial<GlobalConfig>,
    newEncryptionPassword?: string,
  ): void {
    ClientLogger.debug('Updating configuration');
    if (newSessionConfig) {
      this.sessionConfig = { ...this.sessionConfig, ...newSessionConfig };
      ClientLogger.debug('Session config updated', { newConfig: newSessionConfig });
    }
    if (newGlobalConfig) {
      this.globalConfig.initialize(newGlobalConfig);
      ClientLogger.debug('Global config updated', { newConfig: newGlobalConfig });
    }
    if (newEncryptionPassword !== undefined) {
      this.encryptionPassword = newEncryptionPassword;
      ClientLogger.debug('Encryption password updated', { passwordSet: !!newEncryptionPassword });
    }
    this.initialize(this.encryptionPassword);
    ClientLogger.debug('Configuration updated and modules reinitialized');
  },
};

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

// Initialize the module without encryption by default
CookieUtils.initialize();

export default CookieUtils;
