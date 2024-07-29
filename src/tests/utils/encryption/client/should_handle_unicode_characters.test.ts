import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('unicode-characters-encryption.log');
const log = createLogger(logStream);

describe('Encryption and Decryption of Strings with Unicode Characters', () => {
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

  const testUnicodeEncryption = async (testString: string): Promise<void> => {
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

  it('should handle Basic Latin Unicode characters', async () => {
    const basicLatin = 'Hello, World! 123';
    await expect(testUnicodeEncryption(basicLatin)).resolves.not.toThrow();
  });

  it('should handle Latin-1 Supplement Unicode characters', async () => {
    const latin1Supplement = 'áéíóúüñ¿¡';
    await expect(testUnicodeEncryption(latin1Supplement)).resolves.not.toThrow();
  });

  it('should handle Greek and Coptic Unicode characters', async () => {
    const greekAndCoptic = 'αβγδεζηθικλμνξοπρστυφχψω';
    await expect(testUnicodeEncryption(greekAndCoptic)).resolves.not.toThrow();
  });

  it('should handle Cyrillic Unicode characters', async () => {
    const cyrillic = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
    await expect(testUnicodeEncryption(cyrillic)).resolves.not.toThrow();
  });

  it('should handle CJK Unicode characters', async () => {
    const cjk = '你好世界こんにちは세계안녕하세요';
    await expect(testUnicodeEncryption(cjk)).resolves.not.toThrow();
  });

  it('should handle Arabic Unicode characters', async () => {
    const arabic = 'مرحبا بالعالم';
    await expect(testUnicodeEncryption(arabic)).resolves.not.toThrow();
  });

  it('should handle Hebrew Unicode characters', async () => {
    const hebrew = 'שלום עולם';
    await expect(testUnicodeEncryption(hebrew)).resolves.not.toThrow();
  });

  it('should handle mixed Unicode characters', async () => {
    const mixed = 'Hello, Здравствуй, こんにちは, 你好, مرحبا, שלום, 안녕하세요!';
    await expect(testUnicodeEncryption(mixed)).resolves.not.toThrow();
  });

  it('should handle Emoji Unicode characters', async () => {
    const emoji = '😀🌍🚀💻🔒🎉🎊🎈';
    await expect(testUnicodeEncryption(emoji)).resolves.not.toThrow();
  });

  it('should handle Unicode characters from Private Use Area', async () => {
    const privateUseArea = '\uE000\uE001\uF8FF';
    await expect(testUnicodeEncryption(privateUseArea)).resolves.not.toThrow();
  });
});
