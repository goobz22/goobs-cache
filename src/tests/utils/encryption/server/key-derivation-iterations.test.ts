import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('key-derivation-iterations-encryption.log');
const log = createLogger(logStream);

describe('Key Derivation Iterations in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const testEncryptionDecryption = async (
    data: Uint8Array,
    password: string,
    config: CacheConfig,
  ): Promise<void> => {
    const startTime = Date.now();
    const encryptedValue = await encrypt(data, password, config);
    const encryptionTime = Date.now() - startTime;

    const decryptedData = await decrypt(encryptedValue, password, config);
    const decryptionTime = Date.now() - startTime - encryptionTime;

    expect(decryptedData).toEqual(data);
    log(`Encryption time: ${encryptionTime}ms, Decryption time: ${decryptionTime}ms`);
  };

  it('should work with default configuration', async () => {
    const data = new TextEncoder().encode('Test data for default configuration');
    const password = 'default-config-test-password';
    await expect(testEncryptionDecryption(data, password, mockCacheConfig)).resolves.not.toThrow();
  });

  it('should work with different key sizes', async () => {
    const data = new TextEncoder().encode('Test data for different key sizes');
    const password = 'key-size-test-password';
    const config: CacheConfig = { ...mockCacheConfig, keySize: 128 };

    await expect(testEncryptionDecryption(data, password, config)).resolves.not.toThrow();
  });

  it('should produce different encrypted values with different configurations', async () => {
    const data = new TextEncoder().encode('Test data for different configurations');
    const password = 'different-config-test-password';
    const config1: CacheConfig = { ...mockCacheConfig, keySize: 128 };
    const config2: CacheConfig = { ...mockCacheConfig, keySize: 256 };

    const encryptedValue1 = await encrypt(data, password, config1);
    const encryptedValue2 = await encrypt(data, password, config2);

    expect(encryptedValue1.encryptedData).not.toEqual(encryptedValue2.encryptedData);
  });

  it('should fail with unsupported key size', async () => {
    const data = new TextEncoder().encode('Test data for unsupported key size');
    const password = 'unsupported-key-size-test-password';
    const config: CacheConfig = { ...mockCacheConfig, keySize: 64 };

    await expect(encrypt(data, password, config)).rejects.toThrow();
  });

  it('should handle large data encryption and decryption', async () => {
    const largeData = new Uint8Array(1024 * 1024); // 1MB of data
    crypto.getRandomValues(largeData);
    const password = 'large-data-test-password';

    await expect(
      testEncryptionDecryption(largeData, password, mockCacheConfig),
    ).resolves.not.toThrow();
  });
});
