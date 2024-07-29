import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('mixed-character-encodings-encryption.log');
const log = createLogger(logStream);

describe('Mixed Character Encodings in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const password = 'mixed-encodings-test-password';
  const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

  it('should handle ASCII characters', async () => {
    const asciiString = 'Hello, World! 123';
    const data = new TextEncoder().encode(asciiString);

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(new TextDecoder().decode(decryptedData)).toBe(asciiString);
  });

  it('should handle UTF-8 characters', async () => {
    const utf8String = '你好，世界！ こんにちは、世界！ Здравствуй, мир!';
    const data = new TextEncoder().encode(utf8String);

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(new TextDecoder().decode(decryptedData)).toBe(utf8String);
  });

  it('should handle emoji characters', async () => {
    const emojiString = '😀🌍🚀💻🔒🎉🌈🍕🎸🏆';
    const data = new TextEncoder().encode(emojiString);

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(new TextDecoder().decode(decryptedData)).toBe(emojiString);
  });

  it('should handle mixed ASCII, UTF-8, and emoji characters', async () => {
    const mixedString = 'Hello, 世界! 🌍 Здравствуй, мир! 🚀 こんにちは、世界! 💻';
    const data = new TextEncoder().encode(mixedString);

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(new TextDecoder().decode(decryptedData)).toBe(mixedString);
  });

  it('should handle special characters and symbols', async () => {
    const specialCharsString = '!@#$%^&*()_+-=[]{}|;:,.<>?`~"\'\\';
    const data = new TextEncoder().encode(specialCharsString);

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(new TextDecoder().decode(decryptedData)).toBe(specialCharsString);
  });

  it('should handle null characters and control characters', async () => {
    const controlCharsString = '\0\t\n\r\x1B';
    const data = new TextEncoder().encode(controlCharsString);

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(new TextDecoder().decode(decryptedData)).toBe(controlCharsString);
  });
});
