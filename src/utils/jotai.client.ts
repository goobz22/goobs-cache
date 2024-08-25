'use client';

import { useAtom as jotaiUseAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { ClientLogger } from 'goobs-testing';
import { GlobalConfig, SessionCacheConfig } from '../types';
import { ClientCompressionModule as ClientCompressionModuleImport } from './compression.client';
import { EncryptedValue, ClientEncryptionModule } from 'goobs-encryption';
import HitCountModule from './hitCount.client';
import ClientLastDateModule from './lastDate.client';

// Extend the ClientCompressionModule type with an initialize method
const ClientCompressionModule: typeof ClientCompressionModuleImport & {
  initialize: (compression: SessionCacheConfig['compression'], globalConfig: GlobalConfig) => void;
} = {
  ...ClientCompressionModuleImport,
  initialize: () => {}, // Add a no-op initialize method if it doesn't exist
};

const defaultSessionConfig: Omit<SessionCacheConfig, 'encryption'> = {
  cacheSize: 5000,
  cacheMaxAge: 1800000,
  evictionPolicy: 'lru',
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

const JotaiClientModule = {
  globalConfig: defaultGlobalConfig,
  sessionConfig: defaultSessionConfig,
  encryptionPassword: undefined as string | undefined,
  itemNotFoundCache: new Set<string>(),

  initialize(encryptionPassword?: string): void {
    ClientLogger.debug('Initializing JotaiClientModule');
    this.encryptionPassword = encryptionPassword;

    ClientLogger.debug('Initializing loggers', { globalConfig: this.globalConfig });
    this.globalConfig.initialize(this.globalConfig);
    ClientLogger.initializeLogger(this.globalConfig);

    if (this.encryptionPassword) {
      ClientLogger.debug('Initializing encryption module');
      ClientEncryptionModule.initialize(
        {
          algorithm: 'aes-256-gcm',
          encryptionPassword: this.encryptionPassword,
          keyCheckIntervalMs: 86400000,
          keyRotationIntervalMs: 7776000000,
        },
        this.globalConfig,
      );
    } else {
      ClientLogger.debug('Encryption disabled: No encryption password provided');
    }

    ClientCompressionModule.initialize(this.sessionConfig.compression, this.globalConfig);

    ClientLogger.debug('JotaiClientModule initialized successfully');
  },

  atom<Value>(initialValue: Value) {
    const key = `atom-${Math.random().toString(36).substr(2, 9)}`;

    return atomWithStorage<Value>(key, initialValue, {
      getItem: (key, initialValue) => {
        const item = sessionStorage.getItem(key);
        if (item !== null) {
          try {
            ClientLogger.debug('Parsing stored item', { key });
            let parsedItem = JSON.parse(item);

            if (this.encryptionPassword) {
              ClientLogger.debug('Decrypting item', { key });
              let decrypted: Uint8Array | null = null;
              ClientEncryptionModule.decrypt(parsedItem as EncryptedValue, (result) => {
                decrypted = result;
              });
              if (decrypted) {
                parsedItem = decrypted;
              } else {
                ClientLogger.warn(
                  'Decryption failed, using parsed (potentially unencrypted) value',
                  { key },
                );
                return initialValue;
              }
            }

            ClientLogger.debug('Decompressing item', { key });
            const decompressed = ClientCompressionModule.decompressData(parsedItem, 'string');
            if (decompressed === null) {
              ClientLogger.warn('Decompression failed, using initial value', { key });
              return initialValue;
            }
            let result: Value;
            if (typeof decompressed === 'string') {
              result = JSON.parse(decompressed);
            } else {
              // If decompressed is a Uint8Array, convert it to a string
              const decoder = new TextDecoder();
              result = JSON.parse(decoder.decode(decompressed));
            }
            ClientLogger.debug('Successfully retrieved and processed item', { key, result });
            return result;
          } catch (error) {
            ClientLogger.error(`Failed to parse stored value for key ${key}`, { error });
            return initialValue;
          }
        }
        if (!this.itemNotFoundCache) {
          this.itemNotFoundCache = new Set<string>();
        }
        if (!this.itemNotFoundCache.has(key)) {
          this.itemNotFoundCache.add(key);
        }
        return initialValue;
      },
      setItem: (key, value) => {
        const stringValue = JSON.stringify(value);

        const compressionResult = ClientCompressionModule.compressData(stringValue);

        if (compressionResult === null) {
          return;
        }

        let dataToStore: string | Uint8Array = compressionResult.data;
        const isCompressed = compressionResult.compressed;

        if (this.encryptionPassword) {
          ClientLogger.debug('Encrypting value', { key, isCompressed });
          let encrypted: EncryptedValue | undefined;
          ClientEncryptionModule.encrypt(dataToStore, (result) => {
            encrypted = result;
          });
          if (encrypted) {
            dataToStore = JSON.stringify({ ...encrypted, isCompressed });
            ClientLogger.debug('Encryption successful', {
              encryptedLength: JSON.stringify(dataToStore).length,
            });
          } else {
            ClientLogger.error('Encryption failed', { key });
            return;
          }
        } else if (isCompressed) {
          // If not encrypted but compressed, we need to store the compression flag
          dataToStore = JSON.stringify({ data: Array.from(dataToStore), isCompressed });
          ClientLogger.debug('Prepared compressed data for storage', {
            dataLength: JSON.stringify(dataToStore).length,
          });
        }

        ClientLogger.debug('Storing value', {
          key,
          isCompressed,
          dataLength: JSON.stringify(dataToStore).length,
        });
        sessionStorage.setItem(key, JSON.stringify(dataToStore));
        ClientLogger.debug('Value stored in sessionStorage');
        ClientLogger.debug('Incrementing set hit count', { key });
        HitCountModule.incrementSetHitCount(
          (k) => sessionStorage.getItem(k),
          (k, v) => sessionStorage.setItem(k, v),
          key,
          'atom',
        );
        ClientLogger.debug('Updating last dates', { key });
        ClientLastDateModule.updateLastDates((k, v) => sessionStorage.setItem(k, v), key, 'atom', {
          lastUpdatedDate: new Date(),
          lastAccessedDate: new Date(),
        });
        ClientLogger.debug(`Saved atom ${key} to storage`, { value });
        this.itemNotFoundCache.delete(key);
      },
      removeItem: (key) => {
        ClientLogger.debug(`Removing atom ${key} from storage`);
        sessionStorage.removeItem(key);
        ClientLogger.debug(`Removed atom ${key} from storage`);
        this.itemNotFoundCache.delete(key);
      },
    });
  },

  useAtom: jotaiUseAtom,

  updateConfig(
    newSessionConfig?: Partial<Omit<SessionCacheConfig, 'encryption'>>,
    newGlobalConfig?: Partial<GlobalConfig>,
    newEncryptionPassword?: string,
  ): void {
    ClientLogger.debug('Updating configuration');
    if (newSessionConfig) {
      this.sessionConfig = { ...this.sessionConfig, ...newSessionConfig };
    }
    if (newGlobalConfig) {
      this.globalConfig.initialize(newGlobalConfig);
    }
    if (newEncryptionPassword !== undefined) {
      this.encryptionPassword = newEncryptionPassword;
    }
    this.initialize(this.encryptionPassword);
    ClientLogger.debug('Configuration updated and modules reinitialized');
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
JotaiClientModule.initialize();

export default JotaiClientModule;
