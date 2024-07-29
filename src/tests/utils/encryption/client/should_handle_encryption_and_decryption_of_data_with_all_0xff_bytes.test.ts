import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('handle-0xff-bytes-encryption.log');
const log = createLogger(logStream);

describe('Encryption and Decryption of Data with All 0xFF Bytes', () => {
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

  const createAllFFData = (size: number): Uint8Array => {
    return new Uint8Array(size).fill(0xff);
  };

  it('should successfully encrypt and decrypt small data with all 0xFF bytes', async () => {
    const smallData = createAllFFData(16); // 16 bytes of 0xFF

    log('Encrypting small data with all 0xFF bytes');
    const encryptedValue = await encryptPromise(smallData, mockCacheConfig);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);

    log('Decrypting small data with all 0xFF bytes');
    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();
    expect(decryptedData).toEqual(smallData);

    log('Small data with all 0xFF bytes successfully encrypted and decrypted');
  });

  it('should handle encryption and decryption of large data with all 0xFF bytes', async () => {
    const largeData = createAllFFData(1000000); // 1MB of 0xFF bytes

    log('Encrypting large data with all 0xFF bytes');
    const encryptedValue = await encryptPromise(largeData, mockCacheConfig);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);

    log('Decrypting large data with all 0xFF bytes');
    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();
    expect(decryptedData).toEqual(largeData);

    log('Large data with all 0xFF bytes successfully encrypted and decrypted');
  });

  it('should encrypt and decrypt data of various sizes with all 0xFF bytes', async () => {
    const sizes = [
      1, 15, 16, 17, 31, 32, 33, 63, 64, 65, 127, 128, 129, 255, 256, 257, 1023, 1024, 1025,
    ];

    for (const size of sizes) {
      const data = createAllFFData(size);

      log(`Encrypting ${size} bytes of data with all 0xFF bytes`);
      const encryptedValue = await encryptPromise(data, mockCacheConfig);

      expect(encryptedValue).toBeDefined();
      expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);

      log(`Decrypting ${size} bytes of data with all 0xFF bytes`);
      const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

      expect(decryptedData).not.toBeNull();
      expect(decryptedData).toEqual(data);

      log(`${size} bytes of data with all 0xFF bytes successfully encrypted and decrypted`);
    }
  });

  it('should maintain data integrity after multiple rounds of encryption and decryption', async () => {
    const initialData = createAllFFData(1024); // 1KB of 0xFF bytes
    let currentData = initialData;
    const rounds = 5;

    for (let i = 0; i < rounds; i++) {
      log(`Round ${i + 1}: Encrypting data`);
      const encryptedValue = await encryptPromise(currentData, mockCacheConfig);

      expect(encryptedValue).toBeDefined();
      expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);

      log(`Round ${i + 1}: Decrypting data`);
      const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

      expect(decryptedData).not.toBeNull();
      expect(decryptedData).toEqual(currentData);

      currentData = decryptedData as Uint8Array;
    }

    expect(currentData).toEqual(initialData);
    log(`Data integrity maintained after ${rounds} rounds of encryption and decryption`);
  });

  it('should handle encryption and decryption of empty data (0 bytes)', async () => {
    const emptyData = new Uint8Array(0);

    log('Encrypting empty data (0 bytes)');
    const encryptedValue = await encryptPromise(emptyData, mockCacheConfig);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);

    log('Decrypting empty data (0 bytes)');
    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();
    expect(decryptedData).toEqual(emptyData);

    log('Empty data (0 bytes) successfully encrypted and decrypted');
  });
});
