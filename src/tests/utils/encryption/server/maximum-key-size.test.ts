import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('maximum-key-size-encryption.log');
const log = createLogger(logStream);

describe('Maximum Key Size Handling in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const testData = new TextEncoder().encode('Test data for maximum key size');

  it('should handle the maximum allowed key size (256 bits)', async () => {
    const password = 'max-key-size-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm', keySize: 256 };

    const encryptedValue = await encrypt(testData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(testData);
  });

  it('should throw an error for key size exceeding the maximum limit', async () => {
    const password = 'exceeding-key-size-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm', keySize: 512 };

    await expect(encrypt(testData, password, config)).rejects.toThrow();
  });

  it('should handle minimum allowed key size (128 bits)', async () => {
    const password = 'min-key-size-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-128-gcm', keySize: 128 };

    const encryptedValue = await encrypt(testData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(testData);
  });

  it('should throw an error for key size below the minimum limit', async () => {
    const password = 'below-min-key-size-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-128-gcm', keySize: 64 };

    await expect(encrypt(testData, password, config)).rejects.toThrow();
  });

  it('should handle different valid key sizes', async () => {
    const password = 'various-key-sizes-test-password';
    const validKeySizes = [128, 192, 256];

    for (const keySize of validKeySizes) {
      const config: CacheConfig = {
        ...mockCacheConfig,
        algorithm: `aes-${keySize}-gcm` as 'aes-256-gcm',
        keySize,
      };

      const encryptedValue = await encrypt(testData, password, config);
      const decryptedData = await decrypt(encryptedValue, password, config);

      expect(decryptedData).toEqual(testData);
    }
  });

  it('should use the same key size for encryption and decryption', async () => {
    const password = 'consistent-key-size-test-password';
    const encryptConfig: CacheConfig = {
      ...mockCacheConfig,
      algorithm: 'aes-256-gcm',
      keySize: 256,
    };
    const decryptConfig: CacheConfig = {
      ...mockCacheConfig,
      algorithm: 'aes-128-gcm',
      keySize: 128,
    };

    const encryptedValue = await encrypt(testData, password, encryptConfig);

    await expect(decrypt(encryptedValue, password, decryptConfig)).rejects.toThrow();
  });
});
