import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('handle-mixed-character-encodings-encryption.log');
const log = createLogger(logStream);

describe('Encryption and Decryption of Data with Mixed Character Encodings', () => {
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

  const isASCII = (str: string): boolean => /^[\u0020-\u007E]*$/.test(str);

  const testMixedEncodingHandling = async (originalString: string) => {
    const data = new TextEncoder().encode(originalString);
    expect(data).toBeDefined();
    expect(data.byteLength).toBeGreaterThan(0);

    log(`Encrypting data: "${originalString}"`);
    const encryptedValue = await encryptPromise(data, mockCacheConfig);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.encryptedData).toBeDefined();
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);
    expect(encryptedValue.iv).toBeDefined();
    expect(encryptedValue.iv.byteLength).toBe(12);
    expect(encryptedValue.salt).toBeDefined();
    expect(encryptedValue.salt.byteLength).toBe(16);
    expect(encryptedValue.authTag).toBeDefined();
    expect(encryptedValue.authTag.byteLength).toBe(16);

    log('Decrypting data');
    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();
    expect(decryptedData).toBeDefined();
    expect(decryptedData!.byteLength).toBe(data.byteLength);

    const decryptedString = new TextDecoder().decode(decryptedData as Uint8Array);
    expect(decryptedString).toBeDefined();
    expect(decryptedString.length).toBe(originalString.length);
    expect(decryptedString).toEqual(originalString);

    log(`Data successfully encrypted and decrypted: "${decryptedString}"`);
  };

  it('should handle ASCII characters', async () => {
    const testString = 'Hello, World!';
    expect(isASCII(testString)).toBe(true);
    await testMixedEncodingHandling(testString);
  });

  it('should handle UTF-8 characters', async () => {
    const testString = 'こんにちは世界！';
    expect(isASCII(testString)).toBe(false);
    await testMixedEncodingHandling(testString);
  });

  it('should handle emojis', async () => {
    const testString = 'Hello 👋 World 🌍';
    expect(testString).toMatch(
      /[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u,
    );
    await testMixedEncodingHandling(testString);
  });

  it('should handle mixed ASCII and UTF-8', async () => {
    const testString = 'Hello, 世界!';
    expect(isASCII(testString)).toBe(false);
    expect(testString).toMatch(/[a-zA-Z]/);
    expect(testString).toMatch(/[^\u0020-\u007E]/);
    await testMixedEncodingHandling(testString);
  });

  it('should handle mixed ASCII, UTF-8, and emojis', async () => {
    const testString = 'Hello, 世界! 🌟';
    expect(isASCII(testString)).toBe(false);
    expect(testString).toMatch(/[a-zA-Z]/);
    expect(testString).toMatch(/[^\u0020-\u007E]/);
    expect(testString).toMatch(
      /[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u,
    );
    await testMixedEncodingHandling(testString);
  });

  it('should handle special characters', async () => {
    const testString = '!@#$%^&*()_+{}[]|\\:;"\'<>,.?/~`';
    expect(isASCII(testString)).toBe(true);
    expect(testString).toMatch(/^[!@#$%^&*()_+{}[\]|\\:;"'<>,.?/~`]+$/);
    await testMixedEncodingHandling(testString);
  });

  it('should handle mixed encodings with numbers', async () => {
    const testString = '123 ABC 你好 456 🎉';
    expect(isASCII(testString)).toBe(false);
    expect(testString).toMatch(/\d+/);
    expect(testString).toMatch(/[A-Z]+/);
    expect(testString).toMatch(/[^\u0020-\u007E]/);
    expect(testString).toMatch(
      /[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u,
    );
    await testMixedEncodingHandling(testString);
  });

  it('should handle very long strings with mixed encodings', async () => {
    const longString = 'A'.repeat(1000) + '你好'.repeat(500) + '🌟'.repeat(250);
    expect(longString.length).toBe(2250);
    expect(isASCII(longString)).toBe(false);
    expect(longString).toMatch(/^A+/);
    expect(longString).toMatch(/[^\u0020-\u007E]/);
    expect(longString).toMatch(
      /[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u,
    );
    await testMixedEncodingHandling(longString);
  });

  it('should handle strings with control characters', async () => {
    const testString = 'Hello\nWorld\tTab\rReturn';
    expect(isASCII(testString)).toBe(true);
    expect(testString).toMatch(/[\n\t\r]/);
    await testMixedEncodingHandling(testString);
  });

  it('should handle strings with zero-width characters', async () => {
    const testString = 'Hello\u200BWorld'; // Contains a zero-width space
    expect(isASCII(testString)).toBe(false);
    expect(testString.length).toBe(11);
    expect(testString.trim().length).toBe(11);
    await testMixedEncodingHandling(testString);
  });

  it('should handle strings with combining characters', async () => {
    const testString = 'e\u0301'; // 'é' composed of 'e' and combining acute accent
    expect(isASCII(testString)).toBe(false);
    expect(testString.normalize('NFC').length).toBe(1);
    expect(testString.length).toBe(2);
    await testMixedEncodingHandling(testString);
  });

  it('should handle strings with surrogate pairs', async () => {
    const testString = '𝄞'; // Musical G-clef symbol (U+1D11E)
    expect(isASCII(testString)).toBe(false);
    expect(testString.length).toBe(2);
    expect([...testString]).toHaveLength(1);
    await testMixedEncodingHandling(testString);
  });

  it('should handle strings with multiple encodings and whitespace', async () => {
    const testString = '  Hello  世界  🌟  \n\t  ';
    expect(isASCII(testString)).toBe(false);
    expect(testString).toMatch(/^\s+/);
    expect(testString).toMatch(/\s+$/);
    expect(testString).toMatch(/[A-Za-z]+/);
    expect(testString).toMatch(/[^\u0020-\u007E]/);
    expect(testString).toMatch(
      /[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u,
    );
    expect(testString).toMatch(/[\n\t]/);
    await testMixedEncodingHandling(testString);
  });

  it('should handle strings with Unicode normalization forms', async () => {
    const nfcString = '\u00E9'; // é in NFC form
    const nfdString = 'e\u0301'; // é in NFD form
    expect(isASCII(nfcString)).toBe(false);
    expect(isASCII(nfdString)).toBe(false);
    expect(nfcString.normalize('NFC')).toEqual(nfdString.normalize('NFC'));
    expect(nfcString).not.toEqual(nfdString);
    await testMixedEncodingHandling(nfcString);
    await testMixedEncodingHandling(nfdString);
  });

  it('should handle strings with invisible Unicode characters', async () => {
    const testString = 'ab\u200Ccd'; // Contains a zero-width non-joiner
    expect(isASCII(testString)).toBe(false);
    expect(testString.length).toBe(5);
    expect(testString.replace(/\u200C/g, '')).toEqual('abcd');
    await testMixedEncodingHandling(testString);
  });

  it('should handle strings with various Unicode scripts', async () => {
    const testString = 'A1 ぁ 亜';
    expect(isASCII(testString)).toBe(false);
    expect(testString).toMatch(/[A-Za-z]/); // Latin
    expect(testString).toMatch(/\d/); // Number
    expect(testString).toMatch(/[\u3040-\u309F]/); // Hiragana
    expect(testString).toMatch(/[\u4E00-\u9FFF]/); // Han (Chinese characters)
    await testMixedEncodingHandling(testString);
  });

  it('should handle strings with bidirectional text', async () => {
    const testString = 'Hello! שלום! مرحبا!';
    expect(isASCII(testString)).toBe(false);
    expect(testString).toMatch(/[A-Za-z]/); // Latin
    expect(testString).toMatch(/[\u0590-\u05FF]/); // Hebrew
    expect(testString).toMatch(/[\u0600-\u06FF]/); // Arabic
    await testMixedEncodingHandling(testString);
  });

  it('should handle strings with unusual Unicode characters', async () => {
    const testString = '\u{1F980}\u{1F984}\u{1F98E}'; // 🦀🦄🦎
    expect(isASCII(testString)).toBe(false);
    expect(testString).toMatch(/[\u{1F980}\u{1F984}\u{1F98E}]/u);
    expect(testString.length).toBe(6); // Each emoji is represented by two code units
    expect([...testString]).toHaveLength(3); // But it's actually 3 characters
    await testMixedEncodingHandling(testString);
  });

  it('should handle strings with mixed case', async () => {
    const testString = 'HeLLo WoRLd';
    expect(isASCII(testString)).toBe(true);
    expect(testString).not.toEqual(testString.toLowerCase());
    expect(testString).not.toEqual(testString.toUpperCase());
    expect(testString.toLowerCase()).toEqual('hello world');
    expect(testString.toUpperCase()).toEqual('HELLO WORLD');
    await testMixedEncodingHandling(testString);
  });

  it('should handle strings with numeric separators', async () => {
    const testString = '1_000_000';
    expect(isASCII(testString)).toBe(true);
    expect(testString).toMatch(/^\d+(_\d+)*$/);
    expect(parseInt(testString.replace(/_/g, ''), 10)).toBe(1000000);
    await testMixedEncodingHandling(testString);
  });

  it('should handle strings with various number systems', async () => {
    const testString = '42 ٤٢ ४२ ໔໒'; // Arabic, Devanagari, Lao numerals
    expect(isASCII(testString)).toBe(false);
    expect(testString).toMatch(/\d+/);
    expect(testString).toMatch(/[\u0660-\u0669]+/); // Arabic-Indic digits
    expect(testString).toMatch(/[\u0966-\u096F]+/); // Devanagari digits
    expect(testString).toMatch(/[\u0ED0-\u0ED9]+/); // Lao digits
    await testMixedEncodingHandling(testString);
  });

  it('should handle strings with mathematical symbols', async () => {
    const testString = '∀x∈ℝ: x² ≥ 0';
    expect(isASCII(testString)).toBe(false);
    expect(testString).toMatch(/[∀∈ℝ²≥]/u);
    await testMixedEncodingHandling(testString);
  });

  it('should handle strings with mixed scripts and symbols', async () => {
    const testString = 'αβγ123АБВ你好€$¥';
    expect(isASCII(testString)).toBe(false);
    expect(testString).toMatch(/[α-γ]/u); // Greek
    expect(testString).toMatch(/\d+/); // Digits
    expect(testString).toMatch(/[А-В]/u); // Cyrillic
    expect(testString).toMatch(/[\u4E00-\u9FFF]/); // Han (Chinese characters)
    expect(testString).toMatch(/[€$¥]/u); // Currency symbols
    await testMixedEncodingHandling(testString);
  });

  it('should handle strings with punctuation from different scripts', async () => {
    const testString = 'Hello!？نقطة。Punkt!';
    expect(isASCII(testString)).toBe(false);
    expect(testString).toMatch(/[A-Za-z]/); // Latin
    expect(testString).toMatch(/[！？。]/u); // CJK punctuation
    expect(testString).toMatch(/[\u0600-\u06FF]/); // Arabic
    await testMixedEncodingHandling(testString);
  });

  it('should handle strings with technical symbols', async () => {
    const testString = '⌘⌥⇧⌃↑↓←→';
    expect(isASCII(testString)).toBe(false);
    expect(testString).toMatch(/[⌘⌥⇧⌃↑↓←→]/u);
    await testMixedEncodingHandling(testString);
  });

  it('should handle strings with combining diacritical marks', async () => {
    const testString = 'a\u0300e\u0301i\u0302o\u0303u\u0304'; // àéîõū
    expect(isASCII(testString)).toBe(false);
    expect(testString.normalize('NFC').length).toBe(5);
    expect(testString.length).toBe(10);
    await testMixedEncodingHandling(testString);
  });

  it('should handle strings with quotation marks from different scripts', async () => {
    const testString = '"Hello" 「こんにちは」 "مرحبا" „Hallo"';
    expect(isASCII(testString)).toBe(false);
    expect(testString).toMatch(/["'"]/); // English quotes
    expect(testString).toMatch(/[「」]/u); // Japanese quotes
    expect(testString).toMatch(/[""]/); // Arabic quotes
    expect(testString).toMatch(/[„"]/u); // German quotes
    await testMixedEncodingHandling(testString);
  });

  it('should handle strings with formatting characters', async () => {
    const testString = 'left\u200Eright\u200Fmixed';
    expect(isASCII(testString)).toBe(false);
    expect(testString.length).toBe(13);
    expect(testString.replace(/[\u200E\u200F]/g, '').length).toBe(11);
    await testMixedEncodingHandling(testString);
  });

  it('should handle strings with line and paragraph separators', async () => {
    const testString = 'Line1\u2028Line2\u2029Paragraph2';
    expect(isASCII(testString)).toBe(false);
    expect(testString.split(/\u2028|\u2029/).length).toBe(3);
    await testMixedEncodingHandling(testString);
  });

  it('should handle strings with private use area characters', async () => {
    const testString = 'Custom: \uE000\uF8FF';
    expect(isASCII(testString)).toBe(false);
    expect(testString).toMatch(/[\uE000-\uF8FF]/u);
    await testMixedEncodingHandling(testString);
  });

  it('should handle strings with variation selectors', async () => {
    const testString = '☃︎☃️'; // Snowman without and with variation selector
    expect(isASCII(testString)).toBe(false);
    expect(testString.length).toBe(3);
    expect([...testString]).toHaveLength(2);
    await testMixedEncodingHandling(testString);
  });

  it('should handle extremely long strings', async () => {
    const longString = 'A'.repeat(10000) + '你好'.repeat(5000) + '🌟'.repeat(2500);
    expect(isASCII(longString)).toBe(false);
    expect(longString.length).toBe(25000);
    await testMixedEncodingHandling(longString);
  });
});
