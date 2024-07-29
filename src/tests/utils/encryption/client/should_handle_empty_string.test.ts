import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('handle-empty-string.log');
const log = createLogger(logStream);

describe('Encryption and Decryption of Empty String', () => {
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

  it('should successfully encrypt and decrypt an empty string', async () => {
    const emptyString = '';
    const emptyBuffer = new TextEncoder().encode(emptyString);

    log('Encrypting empty string');
    const encryptedValue = await encryptPromise(emptyBuffer, mockCacheConfig);

    log(`Encrypted value: ${JSON.stringify(encryptedValue)}`);
    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);

    log('Decrypting empty string');
    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();
    expect(decryptedData?.byteLength).toBe(0);

    const decryptedString = new TextDecoder().decode(decryptedData as Uint8Array);
    expect(decryptedString).toBe(emptyString);

    log('Empty string successfully encrypted and decrypted');
  });

  it('should handle multiple encryptions of empty string', async () => {
    const emptyString = '';
    const emptyBuffer = new TextEncoder().encode(emptyString);

    log('Performing multiple encryptions of empty string');
    const encryptionPromises = Array(5)
      .fill(null)
      .map(() => encryptPromise(emptyBuffer, mockCacheConfig));
    const encryptedValues = await Promise.all(encryptionPromises);

    encryptedValues.forEach((encryptedValue, index) => {
      expect(encryptedValue).toBeDefined();
      expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);
      log(`Encryption ${index + 1} successful`);
    });

    log('Decrypting multiple encrypted empty strings');
    const decryptionPromises = encryptedValues.map((encryptedValue) =>
      decryptPromise(encryptedValue, mockCacheConfig),
    );
    const decryptedDataArray = await Promise.all(decryptionPromises);

    decryptedDataArray.forEach((decryptedData, index) => {
      expect(decryptedData).not.toBeNull();
      expect(decryptedData?.byteLength).toBe(0);
      const decryptedString = new TextDecoder().decode(decryptedData as Uint8Array);
      expect(decryptedString).toBe(emptyString);
      log(`Decryption ${index + 1} successful`);
    });

    log('Multiple empty strings successfully encrypted and decrypted');
  });

  it('should distinguish between empty string and null', async () => {
    const emptyString = '';
    const emptyBuffer = new TextEncoder().encode(emptyString);

    log('Encrypting empty string');
    const encryptedEmpty = await encryptPromise(emptyBuffer, mockCacheConfig);

    log('Decrypting empty string');
    const decryptedEmpty = await decryptPromise(encryptedEmpty, mockCacheConfig);

    expect(decryptedEmpty).not.toBeNull();
    expect(decryptedEmpty?.byteLength).toBe(0);

    log('Attempting to encrypt null');
    const nullBuffer = new Uint8Array(0);
    const encryptedNull = await encryptPromise(nullBuffer, mockCacheConfig);

    log('Decrypting null');
    const decryptedNull = await decryptPromise(encryptedNull, mockCacheConfig);

    expect(decryptedNull).not.toBeNull();
    expect(decryptedNull?.byteLength).toBe(0);

    log('Empty string and null encryption/decryption behave consistently');
  });
});
