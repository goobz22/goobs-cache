import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('very-small-data-encryption.log');
const log = createLogger(logStream);

describe('Encryption and Decryption of Very Small Data Sizes', () => {
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

  const testSmallDataEncryption = async (data: Uint8Array): Promise<void> => {
    const encryptedValue = await encryptPromise(data, mockCacheConfig);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);

    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();
    expect(decryptedData).toBeInstanceOf(Uint8Array);
    expect(decryptedData).toEqual(data);
  };

  it('should handle encryption and decryption of 1 byte', async () => {
    const data = new Uint8Array([42]);
    await expect(testSmallDataEncryption(data)).resolves.not.toThrow();
  });

  it('should handle encryption and decryption of 2 bytes', async () => {
    const data = new Uint8Array([0, 255]);
    await expect(testSmallDataEncryption(data)).resolves.not.toThrow();
  });

  it('should handle encryption and decryption of 3 bytes', async () => {
    const data = new Uint8Array([1, 2, 3]);
    await expect(testSmallDataEncryption(data)).resolves.not.toThrow();
  });

  it('should handle encryption and decryption of 4 bytes', async () => {
    const data = new Uint8Array([255, 0, 255, 0]);
    await expect(testSmallDataEncryption(data)).resolves.not.toThrow();
  });

  it('should handle encryption and decryption of 8 bytes', async () => {
    const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    await expect(testSmallDataEncryption(data)).resolves.not.toThrow();
  });

  it('should handle encryption and decryption of 16 bytes', async () => {
    const data = new Uint8Array(Array.from({ length: 16 }, (_, i) => i));
    await expect(testSmallDataEncryption(data)).resolves.not.toThrow();
  });

  it('should handle encryption and decryption of empty data', async () => {
    const data = new Uint8Array(0);
    await expect(testSmallDataEncryption(data)).resolves.not.toThrow();
  });

  it('should handle encryption and decryption of 32 bytes', async () => {
    const data = new Uint8Array(Array.from({ length: 32 }, (_, i) => i % 256));
    await expect(testSmallDataEncryption(data)).resolves.not.toThrow();
  });

  it('should handle encryption and decryption of 64 bytes', async () => {
    const data = new Uint8Array(Array.from({ length: 64 }, (_, i) => i % 256));
    await expect(testSmallDataEncryption(data)).resolves.not.toThrow();
  });

  it('should handle encryption and decryption of 128 bytes', async () => {
    const data = new Uint8Array(Array.from({ length: 128 }, (_, i) => i % 256));
    await expect(testSmallDataEncryption(data)).resolves.not.toThrow();
  });
});
