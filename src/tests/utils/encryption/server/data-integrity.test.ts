import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig, EncryptedValue } from '../../../../types';

const logStream: WriteStream = createLogStream('data-integrity-encryption.log');
const log = createLogger(logStream);

describe('Data Integrity in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should maintain data integrity after encryption and decryption', async () => {
    const originalData = new TextEncoder().encode('Important data that must remain intact');
    const password = 'integrity-test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(originalData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(originalData);
    expect(new TextDecoder().decode(decryptedData)).toBe('Important data that must remain intact');
  });

  it('should detect tampering with encrypted data', async () => {
    const originalData = new TextEncoder().encode('Sensitive information');
    const password = 'tamper-detection-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(originalData, password, config);

    // Tamper with the encrypted data
    const tamperedEncryptedValue: EncryptedValue = {
      ...encryptedValue,
      encryptedData: new Uint8Array([...encryptedValue.encryptedData, 0]),
    };

    await expect(decrypt(tamperedEncryptedValue, password, config)).rejects.toThrow();
  });

  it('should handle encryption and decryption of empty data', async () => {
    const emptyData = new Uint8Array(0);
    const password = 'empty-data-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(emptyData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(emptyData);
    expect(decryptedData.byteLength).toBe(0);
  });

  it('should maintain integrity for large data sets', async () => {
    const largeData = new Uint8Array(1024 * 1024); // 1MB of data
    crypto.getRandomValues(largeData);
    const password = 'large-data-integrity-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(largeData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toEqual(largeData);
    expect(decryptedData.byteLength).toBe(largeData.byteLength);
  });
});
