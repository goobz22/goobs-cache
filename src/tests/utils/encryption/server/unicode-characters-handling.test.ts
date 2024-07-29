import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('unicode-characters-handling-encryption.log');
const log = createLogger(logStream);

describe('Unicode Characters Handling in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const password = 'unicode-chars-test-password';
  const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

  it('should handle Basic Latin Unicode characters', async () => {
    const basicLatin = 'Hello, World! 123';
    const data = new TextEncoder().encode(basicLatin);

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(new TextDecoder().decode(decryptedData)).toBe(basicLatin);
  });

  it('should handle Latin-1 Supplement Unicode characters', async () => {
    const latin1Supplement = 'áéíóúñÑ¿¡';
    const data = new TextEncoder().encode(latin1Supplement);

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(new TextDecoder().decode(decryptedData)).toBe(latin1Supplement);
  });

  it('should handle Cyrillic Unicode characters', async () => {
    const cyrillic = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя';
    const data = new TextEncoder().encode(cyrillic);

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(new TextDecoder().decode(decryptedData)).toBe(cyrillic);
  });

  it('should handle CJK Unicode characters', async () => {
    const cjk = '你好世界こんにちは안녕하세요';
    const data = new TextEncoder().encode(cjk);

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(new TextDecoder().decode(decryptedData)).toBe(cjk);
  });

  it('should handle Emoji Unicode characters', async () => {
    const emoji = '😀🌍🚀💻🔒🎉🎊🎈';
    const data = new TextEncoder().encode(emoji);

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(new TextDecoder().decode(decryptedData)).toBe(emoji);
  });

  it('should handle mixed Unicode characters', async () => {
    const mixed = 'Hello, Здравствуйте, こんにちは, 你好, 안녕하세요! 😃';
    const data = new TextEncoder().encode(mixed);

    const encryptedValue = await encrypt(data, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(new TextDecoder().decode(decryptedData)).toBe(mixed);
  });
});
