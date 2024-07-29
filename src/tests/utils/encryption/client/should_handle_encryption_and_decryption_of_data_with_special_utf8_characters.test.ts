import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('handle-special-utf8-characters-encryption.log');
const log = createLogger(logStream);

describe('Encryption and Decryption of Data with Special UTF-8 Characters', () => {
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

  const testUTF8Handling = async (originalString: string) => {
    const data = new TextEncoder().encode(originalString);
    expect(data).toBeDefined();
    expect(data.byteLength).toBeGreaterThan(0);
    expect(data.byteLength).toBe(new Blob([originalString]).size);

    log(`Encrypting data: ${originalString}`);
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

    log(`Data successfully encrypted and decrypted: ${decryptedString}`);
  };

  it('should handle multi-byte characters', async () => {
    const testString = 'こんにちは世界';
    expect(testString.length).toBe(7);
    expect(new Blob([testString]).size).toBe(21);
    await testUTF8Handling(testString);
  });

  it('should handle emoji characters', async () => {
    const testString = '👋🌍🚀💻🔒';
    expect(testString.length).toBe(5);
    expect(new Blob([testString]).size).toBe(20);
    await testUTF8Handling(testString);
  });

  it('should handle accented characters', async () => {
    const testString = 'áéíóúñüç';
    expect(testString.length).toBe(8);
    expect(new Blob([testString]).size).toBe(16);
    await testUTF8Handling(testString);
  });

  it('should handle mathematical symbols', async () => {
    const testString = '∀∂∈ℝ∧∪≡∞';
    expect(testString.length).toBe(8);
    expect(new Blob([testString]).size).toBe(24);
    await testUTF8Handling(testString);
  });

  it('should handle currency symbols', async () => {
    const testString = '$€£¥₩₿';
    expect(testString.length).toBe(6);
    expect(new Blob([testString]).size).toBe(14);
    await testUTF8Handling(testString);
  });

  it('should handle arrows and special punctuation', async () => {
    const testString = '←↑→↓↔↕☞☜「」『』';
    expect(testString.length).toBe(12);
    expect(new Blob([testString]).size).toBe(36);
    await testUTF8Handling(testString);
  });

  it('should handle subscripts and superscripts', async () => {
    const testString = 'H₂O and E=mc²';
    expect(testString.length).toBe(13);
    expect(new Blob([testString]).size).toBe(17);
    await testUTF8Handling(testString);
  });

  it('should handle combining diacritical marks', async () => {
    const testString = 'a\u0301e\u0300i\u0302o\u0308u\u0303';
    expect(testString.length).toBe(10);
    expect(new Blob([testString]).size).toBe(15);
    expect(testString.normalize('NFC').length).toBe(5);
    await testUTF8Handling(testString);
  });

  it('should handle non-BMP characters', async () => {
    const testString = '𐐷𐐸𐐺𐐻𐐼𐐽𐐾𐐿';
    expect(testString.length).toBe(16);
    expect(new Blob([testString]).size).toBe(32);
    expect([...testString]).toHaveLength(8);
    await testUTF8Handling(testString);
  });

  it('should handle zero-width characters', async () => {
    const testString = 'invisible\u200Bspace\u200Cbetween\u200Dwords';
    expect(testString.length).toBe(29);
    expect(new Blob([testString]).size).toBe(32);
    expect(testString.replace(/[\u200B-\u200D]/g, '').length).toBe(26);
    await testUTF8Handling(testString);
  });

  it('should handle bi-directional text', async () => {
    const testString = 'Hello שלום Здравствуйте';
    expect(testString.length).toBe(22);
    expect(new Blob([testString]).size).toBe(42);
    expect(testString.match(/\p{Script=Hebrew}/u)).toBeTruthy();
    expect(testString.match(/\p{Script=Cyrillic}/u)).toBeTruthy();
    await testUTF8Handling(testString);
  });

  it('should handle a mix of various UTF-8 characters', async () => {
    const testString = 'Hello 你好 こんにちは 안녕하세요 🌍 ∑∞≠≈ $€£¥';
    expect(testString.length).toBe(29);
    expect(new Blob([testString]).size).toBe(70);
    expect(testString).toMatch(/[\u4E00-\u9FFF]/); // Chinese
    expect(testString).toMatch(/[\u3040-\u309F]/); // Japanese
    expect(testString).toMatch(/[\uAC00-\uD7A3]/); // Korean
    expect(testString).toMatch(/[\u1F300-\u1F5FF]/); // Emoji
    expect(testString).toMatch(/[∑∞≠≈]/); // Mathematical symbols
    expect(testString).toMatch(/[$€£¥]/); // Currency symbols
    await testUTF8Handling(testString);
  });

  it('should handle very long strings with mixed UTF-8 characters', async () => {
    const baseString = 'Hello 你好 こんにちは 안녕하세요 🌍 ∑∞≠≈ $€£¥';
    const longString = baseString.repeat(1000);
    expect(longString.length).toBe(29000);
    expect(new Blob([longString]).size).toBe(70000);

    // Check if the repeated pattern is correct
    for (let i = 0; i < 1000; i++) {
      const startIndex = i * 29;
      const chunk = longString.slice(startIndex, startIndex + 29);
      expect(chunk).toBe(baseString);
    }

    // Verify presence of various character types
    expect(longString.match(/[\u4E00-\u9FFF]/g)!.length).toBe(2000); // Chinese
    expect(longString.match(/[\u3040-\u309F]/g)!.length).toBe(5000); // Japanese
    expect(longString.match(/[\uAC00-\uD7A3]/g)!.length).toBe(5000); // Korean
    expect(longString.match(/[\u1F300-\u1F5FF]/g)!.length).toBe(1000); // Emoji
    expect(longString.match(/[∑∞≠≈]/g)!.length).toBe(4000); // Mathematical symbols
    expect(longString.match(/[$€£¥]/g)!.length).toBe(4000); // Currency symbols

    await testUTF8Handling(longString);
  });

  it('should handle strings with exotic Unicode characters', async () => {
    const testString = '𝕬𝖇𝖈𝕯𝖊𝖋 ⚡ ☂ ❄ ☀ ☃ ☺ ♞ ☕ ♫ ✂';
    expect(testString.length).toBe(21);
    expect(new Blob([testString]).size).toBe(62);
    expect([...testString]).toHaveLength(16); // Actual character count
    expect(testString).toMatch(/[\uD800-\uDBFF][\uDC00-\uDFFF]/); // Surrogate pairs
    expect(testString).toMatch(/[\u2600-\u26FF]/); // Miscellaneous symbols
    await testUTF8Handling(testString);
  });

  it('should handle strings with Unicode normalization forms', async () => {
    const nfcString = '\u00F1'; // ñ in NFC form
    const nfdString = 'n\u0303'; // ñ in NFD form
    expect(nfcString.length).toBe(1);
    expect(nfdString.length).toBe(2);
    expect(new Blob([nfcString]).size).toBe(2);
    expect(new Blob([nfdString]).size).toBe(3);
    expect(nfcString.normalize('NFD')).toBe(nfdString);
    expect(nfdString.normalize('NFC')).toBe(nfcString);
    await testUTF8Handling(nfcString);
    await testUTF8Handling(nfdString);
  });

  it('should handle strings with UTF-16 surrogate pairs', async () => {
    const testString = '𝄞𝄢𝄪🎼🎵🎶';
    expect(testString.length).toBe(12);
    expect([...testString]).toHaveLength(6);
    expect(new Blob([testString]).size).toBe(24);

    const charCodes = testString.split('').map((char) => char.charCodeAt(0));

    // Check high surrogates
    expect(charCodes[0]).toBeGreaterThanOrEqual(0xd800);
    expect(charCodes[0]).toBeLessThanOrEqual(0xdbff);
    expect(charCodes[2]).toBeGreaterThanOrEqual(0xd800);
    expect(charCodes[2]).toBeLessThanOrEqual(0xdbff);
    expect(charCodes[4]).toBeGreaterThanOrEqual(0xd800);
    expect(charCodes[4]).toBeLessThanOrEqual(0xdbff);
    expect(charCodes[6]).toBeGreaterThanOrEqual(0xd800);
    expect(charCodes[6]).toBeLessThanOrEqual(0xdbff);
    expect(charCodes[8]).toBeGreaterThanOrEqual(0xd800);
    expect(charCodes[8]).toBeLessThanOrEqual(0xdbff);
    expect(charCodes[10]).toBeGreaterThanOrEqual(0xd800);
    expect(charCodes[10]).toBeLessThanOrEqual(0xdbff);

    // Check low surrogates
    expect(charCodes[1]).toBeGreaterThanOrEqual(0xdc00);
    expect(charCodes[1]).toBeLessThanOrEqual(0xdfff);
    expect(charCodes[3]).toBeGreaterThanOrEqual(0xdc00);
    expect(charCodes[3]).toBeLessThanOrEqual(0xdfff);
    expect(charCodes[5]).toBeGreaterThanOrEqual(0xdc00);
    expect(charCodes[5]).toBeLessThanOrEqual(0xdfff);
    expect(charCodes[7]).toBeGreaterThanOrEqual(0xdc00);
    expect(charCodes[7]).toBeLessThanOrEqual(0xdfff);
    expect(charCodes[9]).toBeGreaterThanOrEqual(0xdc00);
    expect(charCodes[9]).toBeLessThanOrEqual(0xdfff);
    expect(charCodes[11]).toBeGreaterThanOrEqual(0xdc00);
    expect(charCodes[11]).toBeLessThanOrEqual(0xdfff);

    await testUTF8Handling(testString);
  });

  it('should handle strings with unusual whitespace characters', async () => {
    const testString = 'no-break\u00A0space em\u2003space hair\u200Aspace zero-width\u200Bspace';
    expect(testString.length).toBe(59);
    expect(new Blob([testString]).size).toBe(65);
    expect(testString.split(/\s/).length).toBe(4);
    expect(testString.split(/\S+/).length).toBe(5);
    await testUTF8Handling(testString);
  });

  it('should handle strings with mixed scripts', async () => {
    const testString = 'Latin Кириллица 漢字 αβγδ';
    expect(testString.length).toBe(20);
    expect(new Blob([testString]).size).toBe(38);
    expect(testString).toMatch(/[\p{Script=Latin}]/u);
    expect(testString).toMatch(/[\p{Script=Cyrillic}]/u);
    expect(testString).toMatch(/[\p{Script=Han}]/u);
    expect(testString).toMatch(/[\p{Script=Greek}]/u);
    await testUTF8Handling(testString);
  });
});
