import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('very-long-password-encryption.log');
const log = createLogger(logStream);

describe('Encryption and Decryption with Very Long Password', () => {
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

  const testVeryLongPassword = async (passwordLength: number): Promise<void> => {
    const password: string = 'a'.repeat(passwordLength);
    const originalData: string = 'Test data for very long password';
    const data: Uint8Array = new TextEncoder().encode(originalData);

    const config: CacheConfig = {
      ...mockCacheConfig,
      encryptionPassword: password,
    };

    const encryptedValue: EncryptedValue = await encryptPromise(data, config);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);
    expect(encryptedValue.iv.byteLength).toBe(12);
    expect(encryptedValue.salt.byteLength).toBe(16);
    expect(encryptedValue.authTag.byteLength).toBe(16);

    const decryptedData: Uint8Array | null = await decryptPromise(encryptedValue, config);

    expect(decryptedData).not.toBeNull();
    expect(decryptedData instanceof Uint8Array).toBe(true);

    if (decryptedData !== null) {
      const decryptedString: string = new TextDecoder().decode(decryptedData);
      expect(decryptedString).toEqual(originalData);
    }
  };

  it('should handle encryption and decryption with 1000-character password', async () => {
    await expect(testVeryLongPassword(1000)).resolves.not.toThrow();
  });

  it('should handle encryption and decryption with 10000-character password', async () => {
    await expect(testVeryLongPassword(10000)).resolves.not.toThrow();
  });

  it('should handle encryption and decryption with 100000-character password', async () => {
    await expect(testVeryLongPassword(100000)).resolves.not.toThrow();
  });

  it('should fail encryption with empty password', async () => {
    const data: Uint8Array = new TextEncoder().encode('Test data');
    const config: CacheConfig = {
      ...mockCacheConfig,
      encryptionPassword: '',
    };

    await expect(encryptPromise(data, config)).rejects.toThrow();
  });

  it('should fail decryption with incorrect password length', async () => {
    const originalPassword: string = 'a'.repeat(1000);
    const incorrectPassword: string = 'a'.repeat(999);
    const data: Uint8Array = new TextEncoder().encode('Test data');

    const encryptConfig: CacheConfig = {
      ...mockCacheConfig,
      encryptionPassword: originalPassword,
    };

    const decryptConfig: CacheConfig = {
      ...mockCacheConfig,
      encryptionPassword: incorrectPassword,
    };

    const encryptedValue: EncryptedValue = await encryptPromise(data, encryptConfig);
    const decryptedData: Uint8Array | null = await decryptPromise(encryptedValue, decryptConfig);

    expect(decryptedData).toBeNull();
  });
});
