import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('large-data-handling-encryption.log');
const log = createLogger(logStream);

describe('Large Data Handling in Encryption and Decryption', () => {
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

  it('should handle 1MB of data', async () => {
    const data = generateLargeData(1024 * 1024);
    const password = 'large-data-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(data);
  });

  it('should handle 10MB of data', async () => {
    const data = generateLargeData(10 * 1024 * 1024);
    const password = 'very-large-data-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(data);
  });

  it('should handle 100MB of data', async () => {
    const data = generateLargeData(100 * 1024 * 1024);
    const password = 'extremely-large-data-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(data);
  });

  it('should handle data larger than available memory', async () => {
    const dataSize = 1024 * 1024 * 1024; // 1GB
    const chunkSize = 10 * 1024 * 1024; // 10MB chunks
    const password = 'memory-exceeding-data-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    let encryptedSize = 0;
    let decryptedSize = 0;

    for (let i = 0; i < dataSize; i += chunkSize) {
      const chunk = generateLargeData(Math.min(chunkSize, dataSize - i));
      const encryptedChunk = await encrypt(chunk, password, config);
      encryptedSize += encryptedChunk.encryptedData.byteLength;

      const decryptedChunk = await decrypt(encryptedChunk, password, config);
      decryptedSize += decryptedChunk.byteLength;

      expect(decryptedChunk).toEqual(chunk);
    }

    expect(encryptedSize).toBeGreaterThan(dataSize);
    expect(decryptedSize).toBe(dataSize);
  });
});
