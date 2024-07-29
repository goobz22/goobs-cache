import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('non-default-iv-size-encryption.log');
const log = createLogger(logStream);

describe('Non-Default IV Size in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const testData = new TextEncoder().encode('Test data for non-default IV size');
  const password = 'non-default-iv-size-test-password';

  it('should handle default IV size', async () => {
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };
    const encryptedValue = await encrypt(testData, password, config);
    expect(encryptedValue.iv.byteLength).toBe(12);
    const decryptedData = await decrypt(encryptedValue, password, config);
    expect(decryptedData).toEqual(testData);
  });

  it('should handle encryption and decryption with default IV size', async () => {
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };
    const encryptedValue = await encrypt(testData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    expect(decryptedData).toEqual(testData);
  });

  it('should fail decryption with incorrect IV', async () => {
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };
    const encryptedValue = await encrypt(testData, password, config);
    const incorrectIV = new Uint8Array(encryptedValue.iv.length);
    const modifiedEncryptedValue = { ...encryptedValue, iv: incorrectIV };
    await expect(decrypt(modifiedEncryptedValue, password, config)).rejects.toThrow();
  });

  it('should produce different ciphertexts for the same plaintext due to different IVs', async () => {
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };
    const encryptedValue1 = await encrypt(testData, password, config);
    const encryptedValue2 = await encrypt(testData, password, config);
    expect(encryptedValue1.encryptedData).not.toEqual(encryptedValue2.encryptedData);
    expect(encryptedValue1.iv).not.toEqual(encryptedValue2.iv);
  });

  it('should handle maximum allowed data size with default IV', async () => {
    const largeData = new Uint8Array(1024 * 1024); // 1MB
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };
    const encryptedValue = await encrypt(largeData, password, config);
    const decryptedData = await decrypt(encryptedValue, password, config);
    expect(decryptedData).toEqual(largeData);
  });
});
