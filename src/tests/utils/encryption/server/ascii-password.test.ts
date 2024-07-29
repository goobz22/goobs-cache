import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('ascii-password-encryption.log');
const log = createLogger(logStream);

describe('ASCII Password Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should encrypt and decrypt with ASCII password', async () => {
    const originalData = new TextEncoder().encode('Test data for ASCII password');
    const asciiPassword = 'P@ssw0rd!123';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(originalData, asciiPassword, config);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.type).toBe('encrypted');
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);

    const decryptedData = await decrypt(encryptedValue, asciiPassword, config);

    expect(decryptedData).toBeInstanceOf(Uint8Array);
    expect(decryptedData).toEqual(originalData);

    const decryptedString = new TextDecoder().decode(decryptedData);
    expect(decryptedString).toBe('Test data for ASCII password');
  });

  it('should fail decryption with incorrect ASCII password', async () => {
    const originalData = new TextEncoder().encode('Test data for incorrect password');
    const correctPassword = 'CorrectPassword123!';
    const incorrectPassword = 'WrongPassword456?';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(originalData, correctPassword, config);

    await expect(decrypt(encryptedValue, incorrectPassword, config)).rejects.toThrow();
  });

  it('should encrypt and decrypt with special ASCII characters in password', async () => {
    const originalData = new TextEncoder().encode('Test data for special ASCII characters');
    const specialAsciiPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(originalData, specialAsciiPassword, config);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.type).toBe('encrypted');

    const decryptedData = await decrypt(encryptedValue, specialAsciiPassword, config);

    expect(decryptedData).toBeInstanceOf(Uint8Array);
    expect(decryptedData).toEqual(originalData);
  });
});
