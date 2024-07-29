import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('empty-string-handling-encryption.log');
const log = createLogger(logStream);

describe('Empty String Handling in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should encrypt and decrypt an empty string', async () => {
    const emptyString = new TextEncoder().encode('');
    const password = 'empty-string-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(emptyString, password, config);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.type).toBe('encrypted');
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);

    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toBeInstanceOf(Uint8Array);
    expect(decryptedData.byteLength).toBe(0);
    expect(new TextDecoder().decode(decryptedData)).toBe('');
  });

  it('should produce different encrypted values for empty strings', async () => {
    const emptyString = new TextEncoder().encode('');
    const password = 'different-empty-string-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue1 = await encrypt(emptyString, password, config);
    const encryptedValue2 = await encrypt(emptyString, password, config);

    expect(encryptedValue1.encryptedData).not.toEqual(encryptedValue2.encryptedData);
    expect(encryptedValue1.iv).not.toEqual(encryptedValue2.iv);
    expect(encryptedValue1.salt).not.toEqual(encryptedValue2.salt);
  });

  it('should handle empty string with different passwords', async () => {
    const emptyString = new TextEncoder().encode('');
    const password1 = 'empty-string-password1';
    const password2 = 'empty-string-password2';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue1 = await encrypt(emptyString, password1, config);
    const encryptedValue2 = await encrypt(emptyString, password2, config);

    const decryptedData1 = await decrypt(encryptedValue1, password1, config);
    const decryptedData2 = await decrypt(encryptedValue2, password2, config);

    expect(decryptedData1).toEqual(emptyString);
    expect(decryptedData2).toEqual(emptyString);
    expect(new TextDecoder().decode(decryptedData1)).toBe('');
    expect(new TextDecoder().decode(decryptedData2)).toBe('');
  });

  it('should fail to decrypt an empty string with incorrect password', async () => {
    const emptyString = new TextEncoder().encode('');
    const correctPassword = 'correct-empty-string-password';
    const incorrectPassword = 'incorrect-empty-string-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(emptyString, correctPassword, config);

    await expect(decrypt(encryptedValue, incorrectPassword, config)).rejects.toThrow();
  });
});
