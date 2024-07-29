import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('handle-ascii-password-encryption.log');
const log = createLogger(logStream);

describe('Encryption and Decryption with All ASCII Characters in Password', () => {
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

  const isASCII = (str: string): boolean => {
    for (let i = 0; i < str.length; i++) {
      if (str.charCodeAt(i) > 127) {
        return false;
      }
    }
    return true;
  };

  const testPasswordHandling = async (password: string, originalData: string): Promise<void> => {
    const data: Uint8Array = new TextEncoder().encode(originalData);

    log(`Testing encryption with password: ${password}`);

    const customConfig: CacheConfig = {
      ...mockCacheConfig,
      encryptionPassword: password,
    };

    const encryptedValue: EncryptedValue = await encryptPromise(data, customConfig);

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
    const decryptedData: Uint8Array | null = await decryptPromise(encryptedValue, customConfig);

    expect(decryptedData).not.toBeNull();

    if (decryptedData !== null) {
      const decryptedString: string = new TextDecoder().decode(decryptedData);
      expect(decryptedString).toEqual(originalData);
      log('Data successfully decrypted');
    } else {
      throw new Error('Decryption failed');
    }
  };

  it('should handle printable ASCII characters in password', async () => {
    const asciiPassword: string = Array.from({ length: 95 }, (_, i) =>
      String.fromCharCode(i + 32),
    ).join('');
    expect(asciiPassword.length).toBe(95);
    expect(/^[\x20-\x7E]+$/.test(asciiPassword)).toBe(true);

    await testPasswordHandling(asciiPassword, 'Test data for ASCII password');
  });

  it('should handle control ASCII characters in password', async () => {
    const controlPassword: string = Array.from({ length: 32 }, (_, i) =>
      String.fromCharCode(i),
    ).join('');
    expect(controlPassword.length).toBe(32);
    expect(controlPassword.split('').every((char) => char.charCodeAt(0) < 32)).toBe(true);

    await testPasswordHandling(controlPassword, 'Test data for control characters password');
  });

  it('should handle mixed ASCII characters in password', async () => {
    const mixedPassword: string = Array.from({ length: 128 }, (_, i) =>
      String.fromCharCode(i),
    ).join('');
    expect(mixedPassword.length).toBe(128);
    expect(isASCII(mixedPassword)).toBe(true);

    await testPasswordHandling(mixedPassword, 'Test data for mixed ASCII password');
  });

  it('should handle repeated ASCII characters in password', async () => {
    const repeatedPassword: string =
      'a'.repeat(50) + 'B'.repeat(50) + '1'.repeat(50) + '!'.repeat(50);
    expect(repeatedPassword.length).toBe(200);
    expect(/^[aB1!]+$/.test(repeatedPassword)).toBe(true);

    await testPasswordHandling(repeatedPassword, 'Test data for repeated ASCII password');
  });

  it('should handle long ASCII password', async () => {
    const longPassword: string = Array.from({ length: 1000 }, () =>
      String.fromCharCode(Math.floor(Math.random() * 128)),
    ).join('');
    expect(longPassword.length).toBe(1000);
    expect(isASCII(longPassword)).toBe(true);

    await testPasswordHandling(longPassword, 'Test data for long ASCII password');
  });

  it('should handle short ASCII password', async () => {
    const shortPassword: string = 'a';
    expect(shortPassword.length).toBe(1);
    expect(isASCII(shortPassword)).toBe(true);

    await testPasswordHandling(shortPassword, 'Test data for short ASCII password');
  });

  it('should handle ASCII password with spaces', async () => {
    const spacePassword: string = '   password   with   spaces   ';
    expect(spacePassword.trim().length).toBeLessThan(spacePassword.length);
    expect(isASCII(spacePassword)).toBe(true);

    await testPasswordHandling(spacePassword, 'Test data for ASCII password with spaces');
  });
});
