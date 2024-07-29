import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('handle-repeated-patterns-encryption.log');
const log = createLogger(logStream);

describe('Encryption and Decryption of Data with Repeated Patterns', () => {
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

  const testRepeatedPatternHandling = async (originalString: string) => {
    const data = new TextEncoder().encode(originalString);
    expect(data).toBeDefined();
    expect(data.byteLength).toBe(originalString.length);

    log(`Encrypting data with repeated pattern: "${originalString.slice(0, 50)}..."`);
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

    log('Data successfully encrypted and decrypted');
  };

  it('should handle simple repeated pattern', async () => {
    const testString = 'abcabcabc'.repeat(100);
    expect(testString.length).toBe(900);
    expect(testString).toMatch(/^(abc)+$/);
    await testRepeatedPatternHandling(testString);
  });

  it('should handle repeated numbers', async () => {
    const testString = '123456789'.repeat(1000);
    expect(testString.length).toBe(9000);
    expect(testString).toMatch(/^(\d{9})+$/);
    await testRepeatedPatternHandling(testString);
  });

  it('should handle repeated special characters', async () => {
    const testString = '!@#$%^&*()'.repeat(500);
    expect(testString.length).toBe(5000);
    expect(testString).toMatch(/^([!@#$%^&*()]{10})+$/);
    await testRepeatedPatternHandling(testString);
  });

  it('should handle repeated Unicode characters', async () => {
    const testString = '你好世界'.repeat(250);
    expect(testString.length).toBe(1000);
    expect(testString).toMatch(/^(你好世界)+$/);
    await testRepeatedPatternHandling(testString);
  });

  it('should handle repeated emojis', async () => {
    const testString = '😀😃😄😁😆'.repeat(200);
    expect(testString.length).toBe(1000);
    expect(testString).toMatch(/^(😀😃😄😁😆)+$/);
    await testRepeatedPatternHandling(testString);
  });

  it('should handle a large repeated pattern', async () => {
    const largePattern = 'The quick brown fox jumps over the lazy dog. '.repeat(1000);
    expect(largePattern.length).toBe(44000);
    expect(largePattern).toMatch(/^(The quick brown fox jumps over the lazy dog\. )+$/);
    await testRepeatedPatternHandling(largePattern);
  });

  it('should handle alternating patterns', async () => {
    const testString = 'ab'.repeat(5000);
    expect(testString.length).toBe(10000);
    expect(testString).toMatch(/^(ab)+$/);
    await testRepeatedPatternHandling(testString);
  });

  it('should handle repeated whitespace', async () => {
    const testString = ' \n\t'.repeat(1000);
    expect(testString.length).toBe(3000);
    expect(testString).toMatch(/^( \n\t)+$/);
    await testRepeatedPatternHandling(testString);
  });

  it('should handle a mix of repeated patterns', async () => {
    const mixedPattern = 'abc123!@#你好😀 '.repeat(500);
    expect(mixedPattern.length).toBe(6000);
    expect(mixedPattern).toMatch(/^(abc123!@#你好😀 )+$/);
    await testRepeatedPatternHandling(mixedPattern);
  });

  it('should handle a single character repeated', async () => {
    const testString = 'a'.repeat(10000);
    expect(testString.length).toBe(10000);
    expect(testString).toMatch(/^a+$/);
    await testRepeatedPatternHandling(testString);
  });
});
