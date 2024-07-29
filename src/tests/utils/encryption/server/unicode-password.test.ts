import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('unicode-password-encryption.log');
const log = createLogger(logStream);

describe('Unicode Password Handling in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const testData = new TextEncoder().encode('Test data for Unicode password');
  const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

  it('should handle password with Basic Latin Unicode characters', async () => {
    const password = 'Hello, World! 123';

    const encryptedValue = await encrypt(testData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(testData);
  });

  it('should handle password with Latin-1 Supplement Unicode characters', async () => {
    const password = 'áéíóúñÑ¿¡';

    const encryptedValue = await encrypt(testData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(testData);
  });

  it('should handle password with Cyrillic Unicode characters', async () => {
    const password = 'ПарольПароль';

    const encryptedValue = await encrypt(testData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(testData);
  });

  it('should handle password with CJK Unicode characters', async () => {
    const password = '密码密碼パスワードパスワード비밀번호';

    const encryptedValue = await encrypt(testData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(testData);
  });

  it('should handle password with Emoji Unicode characters', async () => {
    const password = '😀🔑🔒💻';

    const encryptedValue = await encrypt(testData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(testData);
  });

  it('should handle password with mixed Unicode characters', async () => {
    const password = 'Hello, Здравствуйте! こんにちは 你好 😃';

    const encryptedValue = await encrypt(testData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(testData);
  });

  it('should fail decryption with incorrect Unicode password', async () => {
    const correctPassword = 'Correct 密码 😀';
    const incorrectPassword = 'Incorrect 密码 😀';

    const encryptedValue = await encrypt(testData, correctPassword, config);

    await expect(decrypt(encryptedValue, incorrectPassword, config)).rejects.toThrow();
  });
});
