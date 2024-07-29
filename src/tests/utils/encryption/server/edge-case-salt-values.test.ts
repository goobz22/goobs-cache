import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig, EncryptedValue } from '../../../../types';

const logStream: WriteStream = createLogStream('edge-case-salt-values-encryption.log');
const log = createLogger(logStream);

describe('Edge Case Salt Values in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  const testWithSalt = async (salt: Uint8Array): Promise<void> => {
    const originalData = new TextEncoder().encode('Test data for edge case salt');
    const password = 'edge-case-salt-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(originalData, password, config);
    const modifiedEncryptedValue: EncryptedValue = { ...encryptedValue, salt };

    const decryptedData = await decrypt(modifiedEncryptedValue, password, config);

    expect(decryptedData).toEqual(originalData);
    expect(new TextDecoder().decode(decryptedData)).toBe('Test data for edge case salt');
  };

  it('should handle salt with all zero bytes', async () => {
    const zeroSalt = new Uint8Array(16).fill(0);
    await expect(testWithSalt(zeroSalt)).resolves.not.toThrow();
  });

  it('should handle salt with all maximum value bytes', async () => {
    const maxSalt = new Uint8Array(16).fill(255);
    await expect(testWithSalt(maxSalt)).resolves.not.toThrow();
  });

  it('should handle salt with alternating zero and maximum value bytes', async () => {
    const alternatingSalt = new Uint8Array(16).map((_, index) => (index % 2 === 0 ? 0 : 255));
    await expect(testWithSalt(alternatingSalt)).resolves.not.toThrow();
  });

  it('should handle salt with a single non-zero byte', async () => {
    const singleNonZeroSalt = new Uint8Array(16);
    singleNonZeroSalt[8] = 1;
    await expect(testWithSalt(singleNonZeroSalt)).resolves.not.toThrow();
  });

  it('should handle salt with incrementing byte values', async () => {
    const incrementingSalt = new Uint8Array(16).map((_, index) => index);
    await expect(testWithSalt(incrementingSalt)).resolves.not.toThrow();
  });

  it('should fail with incorrect salt length', async () => {
    const originalData = new TextEncoder().encode('Test data for incorrect salt length');
    const password = 'incorrect-salt-length-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(originalData, password, config);
    const modifiedEncryptedValue: EncryptedValue = {
      ...encryptedValue,
      salt: new Uint8Array(15), // Incorrect length
    };

    await expect(decrypt(modifiedEncryptedValue, password, config)).rejects.toThrow();
  });
});
