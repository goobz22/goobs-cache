import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('handle-different-algorithms-encryption.log');
const log = createLogger(logStream);

describe('Encryption and Decryption with Different Algorithms', () => {
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

  const testAlgorithm = async (algorithm: string, keySize: number): Promise<void> => {
    const originalData = 'Test data for different algorithms';
    const data: Uint8Array = new TextEncoder().encode(originalData);

    log(`Testing encryption with algorithm: ${algorithm}, key size: ${keySize}`);

    const config: CacheConfig = {
      ...mockCacheConfig,
      algorithm,
      keySize,
    };

    const encryptedValue: EncryptedValue = await encryptPromise(data, config);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.encryptedData).toBeDefined();
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);
    expect(encryptedValue.iv).toBeDefined();
    expect(encryptedValue.iv.byteLength).toBe(12);
    expect(encryptedValue.salt).toBeDefined();
    expect(encryptedValue.salt.byteLength).toBe(16);
    expect(encryptedValue.authTag).toBeDefined();
    expect(encryptedValue.authTag.byteLength).toBe(16);

    log('Decrypting data');
    const decryptedData: Uint8Array | null = await decryptPromise(encryptedValue, config);

    expect(decryptedData).not.toBeNull();
    expect(decryptedData).toBeInstanceOf(Uint8Array);

    if (decryptedData !== null) {
      const decryptedString: string = new TextDecoder().decode(decryptedData);
      expect(decryptedString).toEqual(originalData);
      log(`Data successfully encrypted and decrypted with ${algorithm}`);
    }
  };

  it('should handle AES-GCM with 128-bit key', async () => {
    await expect(testAlgorithm('aes-128-gcm', 128)).resolves.not.toThrow();
  });

  it('should handle AES-GCM with 192-bit key', async () => {
    await expect(testAlgorithm('aes-192-gcm', 192)).resolves.not.toThrow();
  });

  it('should handle AES-GCM with 256-bit key', async () => {
    await expect(testAlgorithm('aes-256-gcm', 256)).resolves.not.toThrow();
  });

  it('should handle AES-CBC with 128-bit key', async () => {
    await expect(testAlgorithm('aes-128-cbc', 128)).resolves.not.toThrow();
  });

  it('should handle AES-CBC with 192-bit key', async () => {
    await expect(testAlgorithm('aes-192-cbc', 192)).resolves.not.toThrow();
  });

  it('should handle AES-CBC with 256-bit key', async () => {
    await expect(testAlgorithm('aes-256-cbc', 256)).resolves.not.toThrow();
  });

  it('should handle encryption and decryption with changing algorithms', async () => {
    const originalData = 'Data for changing algorithms test';
    const data: Uint8Array = new TextEncoder().encode(originalData);
    const algorithms = [
      { name: 'aes-128-gcm', keySize: 128 },
      { name: 'aes-192-gcm', keySize: 192 },
      { name: 'aes-256-gcm', keySize: 256 },
      { name: 'aes-128-cbc', keySize: 128 },
      { name: 'aes-192-cbc', keySize: 192 },
      { name: 'aes-256-cbc', keySize: 256 },
    ];

    let currentEncryptedValue: EncryptedValue = await encryptPromise(data, {
      ...mockCacheConfig,
      algorithm: algorithms[0].name,
      keySize: algorithms[0].keySize,
    });

    expect(currentEncryptedValue).toBeDefined();

    for (let i = 1; i < algorithms.length; i++) {
      const config: CacheConfig = {
        ...mockCacheConfig,
        algorithm: algorithms[i].name,
        keySize: algorithms[i].keySize,
      };

      const decryptedData = await decryptPromise(currentEncryptedValue, config);
      expect(decryptedData).toBeNull();

      const correctConfig: CacheConfig = {
        ...mockCacheConfig,
        algorithm: algorithms[i - 1].name,
        keySize: algorithms[i - 1].keySize,
      };
      const correctDecryptedData = await decryptPromise(currentEncryptedValue, correctConfig);

      expect(correctDecryptedData).not.toBeNull();
      expect(correctDecryptedData).toBeInstanceOf(Uint8Array);

      const decryptedString = new TextDecoder().decode(correctDecryptedData as Uint8Array);
      expect(decryptedString).toEqual(originalData);

      currentEncryptedValue = await encryptPromise(correctDecryptedData as Uint8Array, config);
      expect(currentEncryptedValue).toBeDefined();
    }

    log('Successfully handled encryption and decryption with changing algorithms');
  });
});
