import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('unicode-password-encryption.log');
const log = createLogger(logStream);

describe('Encryption and Decryption with Unicode Characters in Password', () => {
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

  const testUnicodePassword = async (password: string, originalData: string): Promise<void> => {
    const data: Uint8Array = new TextEncoder().encode(originalData);

    log(`Testing with password: ${password}`);

    const config: CacheConfig = {
      ...mockCacheConfig,
      encryptionPassword: password,
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

    const decryptedData: Uint8Array | null = await decryptPromise(encryptedValue, config);

    expect(decryptedData).not.toBeNull();
    expect(decryptedData).toBeInstanceOf(Uint8Array);

    if (decryptedData !== null) {
      const decryptedString: string = new TextDecoder().decode(decryptedData);
      expect(decryptedString).toEqual(originalData);
      log('Data successfully encrypted and decrypted with Unicode password');
    }
  };

  it('should handle encryption and decryption with emoji password', async () => {
    const password = '🔒🗝️💻';
    const originalData = 'Secret data protected by emojis';
    await expect(testUnicodePassword(password, originalData)).resolves.not.toThrow();
  });

  it('should handle encryption and decryption with Chinese characters password', async () => {
    const password = '密码安全';
    const originalData = 'Data secured with Chinese password';
    await expect(testUnicodePassword(password, originalData)).resolves.not.toThrow();
  });

  it('should handle encryption and decryption with mixed Unicode password', async () => {
    const password = 'P@ssw0rd🔑ñÇáéíóú';
    const originalData = 'Data with mixed Unicode password';
    await expect(testUnicodePassword(password, originalData)).resolves.not.toThrow();
  });

  it('should handle encryption and decryption with long Unicode password', async () => {
    const password = '🔐'.repeat(50); // 50 lock emojis
    const originalData = 'Data with long Unicode password';
    await expect(testUnicodePassword(password, originalData)).resolves.not.toThrow();
  });

  it('should fail decryption with incorrect Unicode password', async () => {
    const correctPassword = '正确的密码';
    const incorrectPassword = '错误的密码';
    const originalData = 'Data for incorrect password test';

    const data: Uint8Array = new TextEncoder().encode(originalData);

    const correctConfig: CacheConfig = {
      ...mockCacheConfig,
      encryptionPassword: correctPassword,
    };

    const incorrectConfig: CacheConfig = {
      ...mockCacheConfig,
      encryptionPassword: incorrectPassword,
    };

    const encryptedValue: EncryptedValue = await encryptPromise(data, correctConfig);

    const decryptedData: Uint8Array | null = await decryptPromise(encryptedValue, incorrectConfig);

    expect(decryptedData).toBeNull();
    log('Decryption with incorrect Unicode password failed as expected');
  });
});
