'use client';

import { useAtom as jotaiUseAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
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

    if (globalConfig) {
      ClientLogger.debug('Initializing loggers', { globalConfig });
      ClientLogger.initializeLogger(globalConfig);
      initializeEncryptionLogger(globalConfig);
      initializeCompressionLogger(globalConfig);
      HitCountModule.initializeLogger(globalConfig);
      ClientLastDateModule.initializeLogger(globalConfig);
    } else {
      ClientLogger.error('Global configuration is undefined');
    }

    if (sessionConfig && globalConfig) {
      ClientLogger.debug('Creating encryption and compression modules', { sessionConfig });
      encryptionModule = createEncryptionModule(sessionConfig.encryption, globalConfig);
      compressionModule = createCompressionModule(sessionConfig.compression, globalConfig);
    } else {
      ClientLogger.error('Session or global configuration is undefined');
    }
  } else {
    ClientLogger.debug('Modules already initialized');
  }
}

export function atom<Value>(initialValue: Value) {
  ClientLogger.debug('Creating atom', { initialValue });
  initializeModules();
  const key = `atom-${Math.random().toString(36).substr(2, 9)}`;
  ClientLogger.debug('Generated atom key', { key });

  return atomWithStorage<Value>(key, initialValue, {
    getItem: async (key, initialValue) => {
      ClientLogger.debug('Getting item from storage', { key });
      const item = sessionStorage.getItem(key);
      if (item !== null && encryptionModule && compressionModule) {
        try {
          ClientLogger.debug('Parsing stored item', { key });
          const parsedItem = JSON.parse(item);
          return new Promise<Value>((resolve) => {
            ClientLogger.debug('Decrypting item', { key });
            encryptionModule!.decrypt(parsedItem, (decrypted) => {
              if (decrypted) {
                ClientLogger.debug('Decompressing item', { key });
                const decompressed = compressionModule!.decompressData(decrypted, 'string');
                const result = JSON.parse(decompressed as string);
                ClientLogger.debug('Successfully retrieved and processed item', { key, result });
                resolve(result);
              } else {
                ClientLogger.warn('Decryption failed, using initial value', { key, initialValue });
                resolve(initialValue);
              }
            });
          });
        } catch (error) {
          ClientLogger.error(`Failed to parse stored value for key ${key}`, { error });
          return initialValue;
        }
      }
      ClientLogger.debug('Item not found or modules not initialized, using initial value', {
        key,
        initialValue,
      });
      return initialValue;
    },
    setItem: async (key, value) => {
      ClientLogger.debug('Setting item in storage', { key, value });
      return new Promise<void>((resolve) => {
        if (encryptionModule && compressionModule) {
          const stringValue = JSON.stringify(value);
          ClientLogger.debug('Compressing value', { key });
          const compressed = compressionModule.compressData(stringValue);
          ClientLogger.debug('Encrypting compressed value', { key });
          encryptionModule.encrypt(compressed, (encrypted) => {
            ClientLogger.debug('Storing encrypted value', { key });
            sessionStorage.setItem(key, JSON.stringify(encrypted));
            ClientLogger.debug('Incrementing set hit count', { key });
            HitCountModule.incrementSetHitCount(
              (k) => sessionStorage.getItem(k),
              (k, v) => sessionStorage.setItem(k, v),
              key,
              'atom',
            );
            ClientLogger.debug('Updating last dates', { key });
            ClientLastDateModule.updateLastDates(
              (k, v) => sessionStorage.setItem(k, v),
              key,
              'atom',
              { lastUpdatedDate: new Date(), lastAccessedDate: new Date() },
            );
            ClientLogger.debug(`Saved atom ${key} to storage`, { value });
            resolve();
          });
        } else {
          ClientLogger.error('Encryption or compression module not initialized');
          resolve();
        }
      });
    },
    removeItem: async (key) => {
      ClientLogger.debug(`Removing atom ${key} from storage`);
      sessionStorage.removeItem(key);
      ClientLogger.debug(`Removed atom ${key} from storage`);
    },
  });
}

export const useAtom = jotaiUseAtom;

export function updateConfig(): void {
  ClientLogger.debug('Updating configuration');
  globalConfig = undefined;
  sessionConfig = undefined;
  encryptionModule = undefined;
  compressionModule = undefined;
  initializeModules();
  ClientLogger.debug('Configuration updated and modules reinitialized');
}

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    ClientLogger.error('Unhandled Rejection at:', {
      reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
      stack: event.reason instanceof Error ? event.reason.stack : undefined,
    });
  });
}

const SessionClientModule = {
  atom,
  useAtom,
  updateConfig,
};

export default SessionClientModule;
