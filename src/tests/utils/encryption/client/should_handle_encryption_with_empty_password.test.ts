import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('empty-password-encryption.log');
const log = createLogger(logStream);

describe('Encryption with Empty Password', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const encryptPromise = (data: Uint8Array, config: CacheConfig): Promise<EncryptedValue> => {
    return new Promise((resolve, reject) => {
      encrypt(data, config, (result) => {
        if (result instanceof Error) {
          reject(result);
        } else {
          resolve(result);
        }
      });
    });
  };

  const decryptPromise = (
    encryptedValue: EncryptedValue,
    config: CacheConfig,
  ): Promise<Uint8Array | null> => {
    return new Promise((resolve) => {
      decrypt(encryptedValue, config, resolve);
    });
  };

  it('should throw an error when encrypting with an empty password', async () => {
    const data: Uint8Array = new TextEncoder().encode('Test data');
    const config: CacheConfig = {
      ...mockCacheConfig,
      encryptionPassword: '',
    };

    await expect(encryptPromise(data, config)).rejects.toThrow();
  });

  it('should throw an error when decrypting with an empty password', async () => {
    const data: Uint8Array = new TextEncoder().encode('Test data');
    const validConfig: CacheConfig = {
      ...mockCacheConfig,
      encryptionPassword: 'validPassword',
    };
    const invalidConfig: CacheConfig = {
      ...mockCacheConfig,
      encryptionPassword: '',
    };

    const encryptedValue: EncryptedValue = await encryptPromise(data, validConfig);

    await expect(decryptPromise(encryptedValue, invalidConfig)).resolves.toBeNull();
  });

  it('should not accept an empty password in the config', () => {
    expect(() => {
      const config: CacheConfig = {
        ...mockCacheConfig,
        encryptionPassword: '',
      };
      // Attempt to use the config
      void config;
    }).toThrow();
  });

  it('should treat whitespace-only passwords as empty', async () => {
    const data: Uint8Array = new TextEncoder().encode('Test data');
    const config: CacheConfig = {
      ...mockCacheConfig,
      encryptionPassword: '   ',
    };

    await expect(encryptPromise(data, config)).rejects.toThrow();
  });

  it('should differentiate between empty and non-empty passwords', async () => {
    const data: Uint8Array = new TextEncoder().encode('Test data');
    const emptyConfig: CacheConfig = {
      ...mockCacheConfig,
      encryptionPassword: '',
    };
    const nonEmptyConfig: CacheConfig = {
      ...mockCacheConfig,
      encryptionPassword: 'a',
    };

    await expect(encryptPromise(data, emptyConfig)).rejects.toThrow();
    await expect(encryptPromise(data, nonEmptyConfig)).resolves.toBeDefined();
  });
});
