import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('password-handling-encryption.log');
const log = createLogger(logStream);

describe('Password Handling in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const testData = new TextEncoder().encode('Test data for password handling');
  const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

  it('should handle short passwords', async () => {
    const shortPassword = 'abc';
    const encryptedValue = await encrypt(testData, shortPassword, config);
    const decryptedData = await decrypt(encryptedValue, shortPassword, config);
    expect(decryptedData).toEqual(testData);
  });

  it('should handle long passwords', async () => {
    const longPassword = 'a'.repeat(1000);
    const encryptedValue = await encrypt(testData, longPassword, config);
    const decryptedData = await decrypt(encryptedValue, longPassword, config);
    expect(decryptedData).toEqual(testData);
  });

  it('should handle passwords with special characters', async () => {
    const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?`~';
    const encryptedValue = await encrypt(testData, specialPassword, config);
    const decryptedData = await decrypt(encryptedValue, specialPassword, config);
    expect(decryptedData).toEqual(testData);
  });

  it('should handle passwords with Unicode characters', async () => {
    const unicodePassword = '你好世界🌍';
    const encryptedValue = await encrypt(testData, unicodePassword, config);
    const decryptedData = await decrypt(encryptedValue, unicodePassword, config);
    expect(decryptedData).toEqual(testData);
  });

  it('should fail decryption with incorrect password', async () => {
    const correctPassword = 'correct_password';
    const incorrectPassword = 'incorrect_password';
    const encryptedValue = await encrypt(testData, correctPassword, config);
    await expect(decrypt(encryptedValue, incorrectPassword, config)).rejects.toThrow();
  });

  it('should handle empty password', async () => {
    const emptyPassword = '';
    await expect(encrypt(testData, emptyPassword, config)).rejects.toThrow();
  });
});
