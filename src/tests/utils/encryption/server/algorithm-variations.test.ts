import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('algorithm-variations-encryption.log');
const log = createLogger(logStream);

describe('Algorithm Variations for Server-side Encryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const testAlgorithmVariation = async (
    algorithm: 'aes-256-gcm' | 'aes-256-ccm',
  ): Promise<void> => {
    const originalData = new TextEncoder().encode('Test data for algorithm variation');
    const password = 'testPassword123';
    const config: CacheConfig = { ...mockCacheConfig, algorithm };

    const encryptedValue = await encrypt(originalData, password, config);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.type).toBe('encrypted');
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);
    expect(encryptedValue.iv.byteLength).toBe(16);
    expect(encryptedValue.salt.byteLength).toBe(16);
    expect(encryptedValue.authTag.byteLength).toBeGreaterThan(0);
    expect(encryptedValue.encryptionKey.byteLength).toBe(32);

    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toBeInstanceOf(Uint8Array);
    expect(decryptedData).toEqual(originalData);

    const decryptedString = new TextDecoder().decode(decryptedData);
    expect(decryptedString).toBe('Test data for algorithm variation');
  };

  it('should encrypt and decrypt using aes-256-gcm algorithm', async () => {
    await expect(testAlgorithmVariation('aes-256-gcm')).resolves.not.toThrow();
  });

  it('should encrypt and decrypt using aes-256-ccm algorithm', async () => {
    await expect(testAlgorithmVariation('aes-256-ccm')).resolves.not.toThrow();
  });

  it('should throw an error for unsupported algorithms', async () => {
    const originalData = new TextEncoder().encode('Test data');
    const password = 'testPassword123';
    const config: CacheConfig = {
      ...mockCacheConfig,
      algorithm: 'unsupported-algo' as 'aes-256-gcm',
    };

    await expect(encrypt(originalData, password, config)).rejects.toThrow('Unsupported algorithm');
  });

  it('should produce different encrypted values for the same input with different algorithms', async () => {
    const originalData = new TextEncoder().encode('Same input, different algorithms');
    const password = 'testPassword123';
    const configGCM: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };
    const configCCM: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-ccm' };

    const encryptedValueGCM = await encrypt(originalData, password, configGCM);
    const encryptedValueCCM = await encrypt(originalData, password, configCCM);

    expect(encryptedValueGCM).not.toEqual(encryptedValueCCM);
    expect(encryptedValueGCM.encryptedData).not.toEqual(encryptedValueCCM.encryptedData);
  });

  it('should handle encryption and decryption of empty data for both algorithms', async () => {
    const emptyData = new Uint8Array(0);
    const password = 'testPassword123';

    for (const algorithm of ['aes-256-gcm', 'aes-256-ccm'] as const) {
      const config: CacheConfig = { ...mockCacheConfig, algorithm };
      const encryptedValue = await encrypt(emptyData, password, config);
      const decryptedData = await decrypt(encryptedValue, password, config);

      expect(decryptedData).toBeInstanceOf(Uint8Array);
      expect(decryptedData.byteLength).toBe(0);
    }
  });
});
