import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('special-characters-encryption.log');
const log = createLogger(logStream);

describe('Encryption and Decryption of Strings with Special Characters', () => {
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

  const testSpecialCharEncryption = async (testString: string): Promise<void> => {
    const data = new TextEncoder().encode(testString);

    const encryptedValue = await encryptPromise(data, mockCacheConfig);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);

    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();
    expect(decryptedData).toBeInstanceOf(Uint8Array);

    const decryptedString = new TextDecoder().decode(decryptedData as Uint8Array);
    expect(decryptedString).toEqual(testString);
  };

  it('should handle ASCII special characters', async () => {
    const specialChars = '!@#$%^&*()_+-={}[]|\\:;"\'<>,.?/~`';
    await expect(testSpecialCharEncryption(specialChars)).resolves.not.toThrow();
  });

  it('should handle Unicode special characters', async () => {
    const unicodeChars = '©®™℠℗℘℮゛゜ヽヾ〃仝々〆〇ー—―‐・';
    await expect(testSpecialCharEncryption(unicodeChars)).resolves.not.toThrow();
  });

  it('should handle emojis', async () => {
    const emojis = '😀😃😄😁😆😅😂🤣😊😇🙂🙃😉😌😍🥰😘😗😙😚😋';
    await expect(testSpecialCharEncryption(emojis)).resolves.not.toThrow();
  });

  it('should handle mixed special characters and normal text', async () => {
    const mixedText = 'Hello, 世界! 🌍 This is a test string with спеціальні символи.';
    await expect(testSpecialCharEncryption(mixedText)).resolves.not.toThrow();
  });

  it('should handle strings with escaped characters', async () => {
    const escapedChars = 'This string has escaped characters: \n \t \\ \' "';
    await expect(testSpecialCharEncryption(escapedChars)).resolves.not.toThrow();
  });

  it('should handle strings with control characters', async () => {
    const controlChars = 'This string has control characters: \x00\x01\x02\x03\x04\x05';
    await expect(testSpecialCharEncryption(controlChars)).resolves.not.toThrow();
  });

  it('should handle strings with surrogate pairs', async () => {
    const surrogatePairs = '𐐷𐐸𐐺𐐻𐐼𐐽𐐾𐐿';
    await expect(testSpecialCharEncryption(surrogatePairs)).resolves.not.toThrow();
  });

  it('should handle strings with combining characters', async () => {
    const combiningChars = 'e\u0301 a\u0300 i\u0302 o\u0308 u\u0303'; // é à î ö ũ
    await expect(testSpecialCharEncryption(combiningChars)).resolves.not.toThrow();
  });
});
