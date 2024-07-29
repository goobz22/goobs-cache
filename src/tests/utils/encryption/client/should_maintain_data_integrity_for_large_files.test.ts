import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('large-files-data-integrity.log');
const log = createLogger(logStream);

describe('Maintain Data Integrity for Large Files', () => {
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

  const generateLargeFile = (size: number): Uint8Array => {
    const data = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      data[i] = i % 256;
    }
    return data;
  };

  const checkIntegrity = (original: Uint8Array, decrypted: Uint8Array): void => {
    expect(decrypted.length).toBe(original.length);
    expect(decrypted).toEqual(original);
  };

  it('should maintain data integrity for a 10MB file', async () => {
    const originalData = generateLargeFile(10 * 1024 * 1024);
    const encryptedValue = await encryptPromise(originalData, mockCacheConfig);
    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();
    checkIntegrity(originalData, decryptedData as Uint8Array);
  });

  it('should maintain data integrity for a 100MB file', async () => {
    const originalData = generateLargeFile(100 * 1024 * 1024);
    const encryptedValue = await encryptPromise(originalData, mockCacheConfig);
    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();
    checkIntegrity(originalData, decryptedData as Uint8Array);
  });

  it('should maintain data integrity for a 1GB file', async () => {
    const originalData = generateLargeFile(1024 * 1024 * 1024);
    const encryptedValue = await encryptPromise(originalData, mockCacheConfig);
    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();
    checkIntegrity(originalData, decryptedData as Uint8Array);
  });

  it('should maintain integrity of specific byte patterns', async () => {
    const patterns = [
      new Uint8Array([255, 255, 255, 255]),
      new Uint8Array([0, 0, 0, 0]),
      new Uint8Array([1, 2, 4, 8, 16, 32, 64, 128]),
    ];

    for (const pattern of patterns) {
      const encryptedValue = await encryptPromise(pattern, mockCacheConfig);
      const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

      expect(decryptedData).not.toBeNull();
      checkIntegrity(pattern, decryptedData as Uint8Array);
    }
  });

  it('should maintain integrity of file with repeated patterns', async () => {
    const pattern = new Uint8Array([1, 2, 3, 4, 5]);
    const repeatedPattern = new Uint8Array(1024 * 1024); // 1MB
    for (let i = 0; i < repeatedPattern.length; i += pattern.length) {
      repeatedPattern.set(pattern, i);
    }

    const encryptedValue = await encryptPromise(repeatedPattern, mockCacheConfig);
    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();
    checkIntegrity(repeatedPattern, decryptedData as Uint8Array);
  });

  it('should maintain integrity of file with random data', async () => {
    const randomData = new Uint8Array(10 * 1024 * 1024); // 10MB
    crypto.getRandomValues(randomData);

    const encryptedValue = await encryptPromise(randomData, mockCacheConfig);
    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();
    checkIntegrity(randomData, decryptedData as Uint8Array);
  });
});
