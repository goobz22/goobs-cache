import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('maximum-data-size-encryption.log');
const log = createLogger(logStream);

describe('Maximum Data Size Handling in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const generateLargeData = (size: number): Uint8Array => {
    const data = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = Math.floor(Math.random() * 256);
    }
    return data;
  };

  it('should handle the maximum allowed data size', async () => {
    const maxSize = 1024 * 1024 * 1024; // 1GB
    const data = generateLargeData(maxSize);
    const password = 'max-size-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData.byteLength).toBe(maxSize);
    expect(decryptedData).toEqual(data);
  });

  it('should throw an error for data size exceeding the maximum limit', async () => {
    const exceedingSize = 1024 * 1024 * 1024 + 1; // 1GB + 1 byte
    const data = generateLargeData(exceedingSize);
    const password = 'exceeding-size-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    await expect(encrypt(data, password, config)).rejects.toThrow();
  });

  it('should handle data size close to the maximum limit', async () => {
    const closeToMaxSize = 1024 * 1024 * 1024 - 1024; // 1GB - 1KB
    const data = generateLargeData(closeToMaxSize);
    const password = 'close-to-max-size-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData.byteLength).toBe(closeToMaxSize);
    expect(decryptedData).toEqual(data);
  });

  it('should encrypt and decrypt data of various sizes up to the maximum', async () => {
    const sizes = [1024, 1024 * 1024, 10 * 1024 * 1024, 100 * 1024 * 1024, 1024 * 1024 * 1024];
    const password = 'various-sizes-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    for (const size of sizes) {
      const data = generateLargeData(size);
      const encryptedValue = await encrypt(data, password, config);
      const decryptedData = await decrypt(encryptedValue, password, config);

      expect(decryptedData.byteLength).toBe(size);
      expect(decryptedData).toEqual(data);
    }
  });
});
