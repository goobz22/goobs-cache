import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('long-strings-encryption.log');
const log = createLogger(logStream);

describe('Encryption and Decryption of Long Strings', () => {
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

  const generateLongString = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const testLongStringEncryption = async (stringLength: number): Promise<void> => {
    const originalString = generateLongString(stringLength);
    const data = new TextEncoder().encode(originalString);

    const encryptedValue = await encryptPromise(data, mockCacheConfig);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(stringLength);

    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();
    expect(decryptedData).toBeInstanceOf(Uint8Array);

    const decryptedString = new TextDecoder().decode(decryptedData as Uint8Array);
    expect(decryptedString.length).toBe(stringLength);
    expect(decryptedString).toEqual(originalString);
  };

  it('should handle a 10KB string', async () => {
    await expect(testLongStringEncryption(10 * 1024)).resolves.not.toThrow();
  });

  it('should handle a 100KB string', async () => {
    await expect(testLongStringEncryption(100 * 1024)).resolves.not.toThrow();
  });

  it('should handle a 1MB string', async () => {
    await expect(testLongStringEncryption(1024 * 1024)).resolves.not.toThrow();
  });

  it('should handle a 10MB string', async () => {
    await expect(testLongStringEncryption(10 * 1024 * 1024)).resolves.not.toThrow();
  });

  it('should maintain string integrity for very long strings', async () => {
    const longString = generateLongString(5 * 1024 * 1024); // 5MB string
    const data = new TextEncoder().encode(longString);

    const encryptedValue = await encryptPromise(data, mockCacheConfig);
    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();

    const decryptedString = new TextDecoder().decode(decryptedData as Uint8Array);
    expect(decryptedString.length).toBe(longString.length);
    expect(decryptedString).toEqual(longString);

    // Check string integrity at various positions
    const checkPositions = [0, 1000000, 2000000, 3000000, 4000000, longString.length - 1];
    checkPositions.forEach((position) => {
      expect(decryptedString.charAt(position)).toBe(longString.charAt(position));
    });
  });
});
