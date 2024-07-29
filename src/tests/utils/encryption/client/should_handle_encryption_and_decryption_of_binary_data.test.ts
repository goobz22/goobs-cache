import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('handle-binary-data-encryption.log');
const log = createLogger(logStream);

describe('Encryption and Decryption of Binary Data', () => {
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

  it('should successfully encrypt and decrypt small binary data', async () => {
    const binaryData = new Uint8Array([0, 1, 2, 3, 4, 5]);

    log('Encrypting small binary data');
    const encryptedValue = await encryptPromise(binaryData, mockCacheConfig);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);

    log('Decrypting small binary data');
    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();
    expect(decryptedData).toEqual(binaryData);

    log('Small binary data successfully encrypted and decrypted');
  });

  it('should handle encryption and decryption of large binary data', async () => {
    const largeData = new Uint8Array(1000000); // 1MB of data
    crypto.getRandomValues(largeData); // Fill with random values

    log('Encrypting large binary data');
    const encryptedValue = await encryptPromise(largeData, mockCacheConfig);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);

    log('Decrypting large binary data');
    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();
    expect(decryptedData).toEqual(largeData);

    log('Large binary data successfully encrypted and decrypted');
  });

  it('should encrypt and decrypt binary data with all possible byte values', async () => {
    const allByteValues = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      allByteValues[i] = i;
    }

    log('Encrypting binary data with all possible byte values');
    const encryptedValue = await encryptPromise(allByteValues, mockCacheConfig);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);

    log('Decrypting binary data with all possible byte values');
    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();
    expect(decryptedData).toEqual(allByteValues);

    log('Binary data with all possible byte values successfully encrypted and decrypted');
  });

  it('should handle encryption and decryption of binary data with repeating patterns', async () => {
    const repeatingPattern = new Uint8Array([1, 2, 3, 4, 5]);
    const repeatedData = new Uint8Array(100000); // 100KB of repeating data
    for (let i = 0; i < repeatedData.length; i++) {
      repeatedData[i] = repeatingPattern[i % repeatingPattern.length];
    }

    log('Encrypting binary data with repeating patterns');
    const encryptedValue = await encryptPromise(repeatedData, mockCacheConfig);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);

    log('Decrypting binary data with repeating patterns');
    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();
    expect(decryptedData).toEqual(repeatedData);

    log('Binary data with repeating patterns successfully encrypted and decrypted');
  });

  it('should encrypt and decrypt binary data with mostly zero values', async () => {
    const mostlyZeros = new Uint8Array(10000); // 10KB of mostly zeros
    mostlyZeros[1000] = 1; // Add a non-zero value
    mostlyZeros[5000] = 255; // Add another non-zero value

    log('Encrypting binary data with mostly zero values');
    const encryptedValue = await encryptPromise(mostlyZeros, mockCacheConfig);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);

    log('Decrypting binary data with mostly zero values');
    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();
    expect(decryptedData).toEqual(mostlyZeros);

    log('Binary data with mostly zero values successfully encrypted and decrypted');
  });
});
