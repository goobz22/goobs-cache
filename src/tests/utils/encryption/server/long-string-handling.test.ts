import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('long-string-handling-encryption.log');
const log = createLogger(logStream);

describe('Long String Handling in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const generateLongString = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  it('should handle a 1KB string', async () => {
    const longString = generateLongString(1024);
    const data = new TextEncoder().encode(longString);
    const password = '1kb-string-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    const decryptedString = new TextDecoder().decode(decryptedData);

    expect(decryptedString).toBe(longString);
  });

  it('should handle a 1MB string', async () => {
    const longString = generateLongString(1024 * 1024);
    const data = new TextEncoder().encode(longString);
    const password = '1mb-string-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    const decryptedString = new TextDecoder().decode(decryptedData);

    expect(decryptedString).toBe(longString);
  });

  it('should handle a 10MB string', async () => {
    const longString = generateLongString(10 * 1024 * 1024);
    const data = new TextEncoder().encode(longString);
    const password = '10mb-string-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    const decryptedString = new TextDecoder().decode(decryptedData);

    expect(decryptedString).toBe(longString);
  });

  it('should handle a string with repeated patterns', async () => {
    const repeatedPattern = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const longString = repeatedPattern.repeat(1024 * 1024);
    const data = new TextEncoder().encode(longString);
    const password = 'repeated-pattern-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    const decryptedString = new TextDecoder().decode(decryptedData);

    expect(decryptedString).toBe(longString);
  });

  it('should handle a string with Unicode characters', async () => {
    const unicodeString = '😀🌍🚀💻🔒'.repeat(1024 * 1024);
    const data = new TextEncoder().encode(unicodeString);
    const password = 'unicode-string-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    const decryptedString = new TextDecoder().decode(decryptedData);

    expect(decryptedString).toBe(unicodeString);
  });
});
