import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('large-data-encryption.log');
const log = createLogger(logStream);

describe('Encryption and Decryption of Large Data', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const encryptPromise = (data: Uint8Array, config: CacheConfig): Promise<EncryptedValue> => {
    return new Promise((resolve) => {
      encrypt(data, config, resolve);
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

  const generateLargeData = (size: number): Uint8Array => {
    const data = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = i % 256;
    }
    return data;
  };

  const testLargeDataEncryption = async (dataSize: number): Promise<void> => {
    const originalData = generateLargeData(dataSize);

    const encryptedValue = await encryptPromise(originalData, mockCacheConfig);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(dataSize);

    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();
    expect(decryptedData).toBeInstanceOf(Uint8Array);
    expect(decryptedData!.byteLength).toBe(dataSize);
    expect(decryptedData).toEqual(originalData);
  };

  it('should handle 1MB of data', async () => {
    await expect(testLargeDataEncryption(1024 * 1024)).resolves.not.toThrow();
  });

  it('should handle 10MB of data', async () => {
    await expect(testLargeDataEncryption(10 * 1024 * 1024)).resolves.not.toThrow();
  });

  it('should handle 100MB of data', async () => {
    await expect(testLargeDataEncryption(100 * 1024 * 1024)).resolves.not.toThrow();
  });

  it('should handle encryption and decryption of data larger than available memory', async () => {
    const dataSize = 1024 * 1024 * 1024; // 1GB
    const chunkSize = 10 * 1024 * 1024; // 10MB chunks
    const encryptedChunks: EncryptedValue[] = [];

    for (let i = 0; i < dataSize; i += chunkSize) {
      const chunk = generateLargeData(Math.min(chunkSize, dataSize - i));
      const encryptedChunk = await encryptPromise(chunk, mockCacheConfig);
      encryptedChunks.push(encryptedChunk);
    }

    expect(encryptedChunks.length).toBe(Math.ceil(dataSize / chunkSize));

    let decryptedSize = 0;
    for (const encryptedChunk of encryptedChunks) {
      const decryptedChunk = await decryptPromise(encryptedChunk, mockCacheConfig);
      expect(decryptedChunk).not.toBeNull();
      expect(decryptedChunk).toBeInstanceOf(Uint8Array);
      decryptedSize += decryptedChunk!.byteLength;
    }

    expect(decryptedSize).toBe(dataSize);
  });
});
