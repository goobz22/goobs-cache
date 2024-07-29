import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('handle-maximum-key-size-encryption.log');
const log = createLogger(logStream);

describe('Encryption and Decryption with Maximum Supported Key Size', () => {
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

  const testMaxKeySizeEncryption = async (algorithm: string, maxKeySize: number): Promise<void> => {
    const originalData = 'Test data for maximum key size encryption';
    const data: Uint8Array = new TextEncoder().encode(originalData);

    log(`Testing encryption with algorithm: ${algorithm}, max key size: ${maxKeySize}`);

    const config: CacheConfig = {
      ...mockCacheConfig,
      algorithm,
      keySize: maxKeySize,
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

    const decryptedString: string = new TextDecoder().decode(decryptedData as Uint8Array);
    expect(decryptedString).toEqual(originalData);
    log(
      `Data successfully encrypted and decrypted with ${algorithm} and max key size ${maxKeySize}`,
    );
  };

  it('should handle AES-GCM with maximum key size (256 bits)', async () => {
    await expect(testMaxKeySizeEncryption('aes-256-gcm', 256)).resolves.not.toThrow();
  });

  it('should handle AES-CBC with maximum key size (256 bits)', async () => {
    await expect(testMaxKeySizeEncryption('aes-256-cbc', 256)).resolves.not.toThrow();
  });

  it('should fail gracefully with key size larger than maximum', async () => {
    const originalData = 'Test data for oversized key';
    const data: Uint8Array = new TextEncoder().encode(originalData);

    const config: CacheConfig = {
      ...mockCacheConfig,
      algorithm: 'aes-256-gcm',
      keySize: 512, // Larger than maximum supported
    };

    await expect(encryptPromise(data, config)).rejects.toThrow();
    log('Encryption with oversized key failed as expected');
  });

  it('should handle encryption and decryption with different valid key sizes', async () => {
    const originalData = 'Test data for different key sizes';
    const data: Uint8Array = new TextEncoder().encode(originalData);

    const keySizes = [128, 192, 256];

    for (const keySize of keySizes) {
      const config: CacheConfig = {
        ...mockCacheConfig,
        algorithm: 'aes-gcm',
        keySize,
      };

      log(`Testing with key size: ${keySize}`);

      const encryptedValue: EncryptedValue = await encryptPromise(data, config);
      expect(encryptedValue).toBeDefined();

      const decryptedData: Uint8Array | null = await decryptPromise(encryptedValue, config);
      expect(decryptedData).not.toBeNull();
      expect(decryptedData).toBeInstanceOf(Uint8Array);

      const decryptedString: string = new TextDecoder().decode(decryptedData as Uint8Array);
      expect(decryptedString).toEqual(originalData);
      log(`Successfully encrypted and decrypted with key size ${keySize}`);
    }
  });
});
