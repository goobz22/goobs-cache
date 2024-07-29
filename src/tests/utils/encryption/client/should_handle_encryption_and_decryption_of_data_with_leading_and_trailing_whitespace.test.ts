import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('handle-whitespace-encryption.log');
const log = createLogger(logStream);

describe('Encryption and Decryption of Data with Leading and Trailing Whitespace', () => {
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

  const testWhitespaceHandling = async (originalString: string) => {
    const data = new TextEncoder().encode(originalString);
    expect(data).toBeDefined();
    expect(data.byteLength).toBe(originalString.length);

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

  it('should handle leading spaces', async () => {
    const testString = '   Hello, World!';
    expect(testString.startsWith('   ')).toBe(true);
    await testWhitespaceHandling(testString);
  });

  it('should handle trailing spaces', async () => {
    const testString = 'Hello, World!   ';
    expect(testString.endsWith('   ')).toBe(true);
    await testWhitespaceHandling(testString);
  });

  it('should handle leading and trailing spaces', async () => {
    const testString = '   Hello, World!   ';
    expect(testString.startsWith('   ')).toBe(true);
    expect(testString.endsWith('   ')).toBe(true);
    await testWhitespaceHandling(testString);
  });

  it('should handle leading tabs', async () => {
    const testString = '\t\tHello, World!';
    expect(testString.startsWith('\t\t')).toBe(true);
    await testWhitespaceHandling(testString);
  });

  it('should handle trailing tabs', async () => {
    const testString = 'Hello, World!\t\t';
    expect(testString.endsWith('\t\t')).toBe(true);
    await testWhitespaceHandling(testString);
  });

  it('should handle leading and trailing tabs', async () => {
    const testString = '\t\tHello, World!\t\t';
    expect(testString.startsWith('\t\t')).toBe(true);
    expect(testString.endsWith('\t\t')).toBe(true);
    await testWhitespaceHandling(testString);
  });

  it('should handle leading newlines', async () => {
    const testString = '\n\nHello, World!';
    expect(testString.startsWith('\n\n')).toBe(true);
    await testWhitespaceHandling(testString);
  });

  it('should handle trailing newlines', async () => {
    const testString = 'Hello, World!\n\n';
    expect(testString.endsWith('\n\n')).toBe(true);
    await testWhitespaceHandling(testString);
  });

  it('should handle leading and trailing newlines', async () => {
    const testString = '\n\nHello, World!\n\n';
    expect(testString.startsWith('\n\n')).toBe(true);
    expect(testString.endsWith('\n\n')).toBe(true);
    await testWhitespaceHandling(testString);
  });

  it('should handle mixed whitespace characters', async () => {
    const testString = ' \t\n Hello, World! \n\t ';
    expect(testString.trim()).not.toEqual(testString);
    await testWhitespaceHandling(testString);
  });

  it('should handle only whitespace', async () => {
    const testString = '   \t\t\n\n   ';
    expect(testString.trim()).toBe('');
    await testWhitespaceHandling(testString);
  });

  it('should handle Unicode whitespace characters', async () => {
    const testString = '\u2000\u2001Hello, World!\u2002\u2003';
    expect(testString.trim()).not.toEqual(testString);
    await testWhitespaceHandling(testString);
  });

  it('should handle a large string with whitespace', async () => {
    const largeString = ' '.repeat(1000) + 'Hello, World!' + ' '.repeat(1000);
    expect(largeString.length).toBe(2013);
    expect(largeString.trim()).toBe('Hello, World!');
    await testWhitespaceHandling(largeString);
  });

  it('should preserve whitespace within the string', async () => {
    const testString = '  Hello,   World!  ';
    expect(testString.trim()).not.toEqual('Hello, World!');
    await testWhitespaceHandling(testString);
  });

  it('should handle empty string with whitespace', async () => {
    const testString = '   ';
    expect(testString.length).toBe(3);
    expect(testString.trim()).toBe('');
    await testWhitespaceHandling(testString);
  });
});
