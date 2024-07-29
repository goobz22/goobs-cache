import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue } from '../../../../types';

const logStream: WriteStream = createLogStream('encrypt-decrypt-data-correctly.log');
const log = createLogger(logStream);

describe('Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const encryptPromise = (
    data: Uint8Array,
    config: typeof mockCacheConfig,
  ): Promise<EncryptedValue> => {
    return new Promise((resolve) => {
      encrypt(data, config, resolve);
    });
  };

  const decryptPromise = (
    encryptedValue: EncryptedValue,
    config: typeof mockCacheConfig,
  ): Promise<Uint8Array | null> => {
    return new Promise((resolve) => {
      decrypt(encryptedValue, config, resolve);
    });
  };

  it('should encrypt and decrypt data correctly', async () => {
    const originalData = 'This is a test string to be encrypted and decrypted';
    const dataBuffer = new TextEncoder().encode(originalData);

    log('Starting encryption process');
    const encryptedValue = await encryptPromise(dataBuffer, mockCacheConfig);
    log('Data encrypted successfully');
    log('Starting decryption process');

    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);
    if (decryptedData === null) {
      log('Decryption failed');
      throw new Error('Decryption returned null');
    }

    const decryptedString = new TextDecoder().decode(decryptedData);
    log('Data decrypted successfully');

    expect(decryptedString).toEqual(originalData);
    log('Decrypted data matches original data');
  });

  it('should handle empty string', async () => {
    const emptyString = '';
    const dataBuffer = new TextEncoder().encode(emptyString);

    log('Testing encryption and decryption of empty string');
    const encryptedValue = await encryptPromise(dataBuffer, mockCacheConfig);
    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    if (decryptedData === null) {
      log('Decryption of empty string failed');
      throw new Error('Decryption returned null for empty string');
    }

    const decryptedString = new TextDecoder().decode(decryptedData);
    expect(decryptedString).toEqual(emptyString);
    log('Empty string encrypted and decrypted successfully');
  });

  it('should handle large data', async () => {
    const largeData = 'a'.repeat(1000000); // 1MB of 'a'
    const dataBuffer = new TextEncoder().encode(largeData);

    log('Testing encryption and decryption of large data');
    const encryptedValue = await encryptPromise(dataBuffer, mockCacheConfig);
    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    if (decryptedData === null) {
      log('Decryption of large data failed');
      throw new Error('Decryption returned null for large data');
    }

    const decryptedString = new TextDecoder().decode(decryptedData);
    expect(decryptedString).toEqual(largeData);
    log('Large data encrypted and decrypted successfully');
  });

  it('should handle special characters', async () => {
    const specialChars = '!@#$%^&*()_+{}[]|\\:;"\'<>,.?/~`';
    const dataBuffer = new TextEncoder().encode(specialChars);

    log('Testing encryption and decryption of special characters');
    const encryptedValue = await encryptPromise(dataBuffer, mockCacheConfig);
    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    if (decryptedData === null) {
      log('Decryption of special characters failed');
      throw new Error('Decryption returned null for special characters');
    }

    const decryptedString = new TextDecoder().decode(decryptedData);
    expect(decryptedString).toEqual(specialChars);
    log('Special characters encrypted and decrypted successfully');
  });

  it('should handle Unicode characters', async () => {
    const unicodeChars = '你好世界😊';
    const dataBuffer = new TextEncoder().encode(unicodeChars);

    log('Testing encryption and decryption of Unicode characters');
    const encryptedValue = await encryptPromise(dataBuffer, mockCacheConfig);
    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    if (decryptedData === null) {
      log('Decryption of Unicode characters failed');
      throw new Error('Decryption returned null for Unicode characters');
    }

    const decryptedString = new TextDecoder().decode(decryptedData);
    expect(decryptedString).toEqual(unicodeChars);
    log('Unicode characters encrypted and decrypted successfully');
  });
});
