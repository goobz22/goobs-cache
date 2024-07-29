import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('handle-whitespace-only-encryption.log');
const log = createLogger(logStream);

describe('Encryption and Decryption of Data with Only Whitespace', () => {
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

    log(`Encrypting data: "${originalString.replace(/\s/g, '\\s')}"`);
    const encryptedValue = await encryptPromise(data, mockCacheConfig);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);

    log('Decrypting data');
    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();
    expect(decryptedData).toBeDefined();
    expect(decryptedData!.byteLength).toBe(data.byteLength);

    const decryptedString = new TextDecoder().decode(decryptedData as Uint8Array);
    expect(decryptedString).toBeDefined();
    expect(decryptedString.length).toBe(originalString.length);
    expect(decryptedString).toEqual(originalString);

    log(`Data successfully encrypted and decrypted: "${decryptedString.replace(/\s/g, '\\s')}"`);
  };

  it('should handle a single space', async () => {
    const testString = ' ';
    expect(testString.length).toBe(1);
    await testWhitespaceHandling(testString);
  });

  it('should handle multiple spaces', async () => {
    const testString = '     ';
    expect(testString.length).toBe(5);
    await testWhitespaceHandling(testString);
  });

  it('should handle a single tab', async () => {
    const testString = '\t';
    expect(testString.length).toBe(1);
    await testWhitespaceHandling(testString);
  });

  it('should handle multiple tabs', async () => {
    const testString = '\t\t\t';
    expect(testString.length).toBe(3);
    await testWhitespaceHandling(testString);
  });

  it('should handle a single newline', async () => {
    const testString = '\n';
    expect(testString.length).toBe(1);
    await testWhitespaceHandling(testString);
  });

  it('should handle multiple newlines', async () => {
    const testString = '\n\n\n';
    expect(testString.length).toBe(3);
    await testWhitespaceHandling(testString);
  });

  it('should handle a mix of spaces, tabs, and newlines', async () => {
    const testString = ' \t\n \t\n ';
    expect(testString.length).toBe(7);
    await testWhitespaceHandling(testString);
  });

  it('should handle carriage return', async () => {
    const testString = '\r';
    expect(testString.length).toBe(1);
    await testWhitespaceHandling(testString);
  });

  it('should handle form feed', async () => {
    const testString = '\f';
    expect(testString.length).toBe(1);
    await testWhitespaceHandling(testString);
  });

  it('should handle vertical tab', async () => {
    const testString = '\v';
    expect(testString.length).toBe(1);
    await testWhitespaceHandling(testString);
  });

  it('should handle a mix of all whitespace characters', async () => {
    const testString = ' \t\n\r\f\v';
    expect(testString.length).toBe(6);
    await testWhitespaceHandling(testString);
  });

  it('should handle a large string of mixed whitespace', async () => {
    const largeWhitespace = ' \t\n'.repeat(1000);
    expect(largeWhitespace.length).toBe(3000);
    await testWhitespaceHandling(largeWhitespace);
  });

  it('should handle Unicode whitespace characters', async () => {
    const testString =
      '\u00A0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000';
    expect(testString.length).toBe(15);
    await testWhitespaceHandling(testString);
  });

  it('should handle zero-width space', async () => {
    const testString = '\u200B';
    expect(testString.length).toBe(1);
    await testWhitespaceHandling(testString);
  });

  it('should handle an empty string', async () => {
    const testString = '';
    expect(testString.length).toBe(0);
    await testWhitespaceHandling(testString);
  });
});
