import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('basic-encryption-decryption.log');
const log = createLogger(logStream);

describe('Basic Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should encrypt and decrypt a simple string', async () => {
    const originalData = new TextEncoder().encode('Hello, World!');
    const password = 'test-password-123';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(originalData, password, config);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.type).toBe('encrypted');
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);

    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toBeInstanceOf(Uint8Array);
    expect(decryptedData).toEqual(originalData);

    const decryptedString = new TextDecoder().decode(decryptedData);
    expect(decryptedString).toBe('Hello, World!');
  });

  it('should encrypt and decrypt an empty string', async () => {
    const originalData = new TextEncoder().encode('');
    const password = 'empty-string-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(originalData, password, config);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.type).toBe('encrypted');

    const decryptedData = await decrypt(encryptedValue, password, config);

    expect(decryptedData).toBeInstanceOf(Uint8Array);
    expect(decryptedData.byteLength).toBe(0);
  });

  it('should fail decryption with incorrect password', async () => {
    const originalData = new TextEncoder().encode('Sensitive information');
    const correctPassword = 'correct-password';
    const incorrectPassword = 'wrong-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(originalData, correctPassword, config);

    await expect(decrypt(encryptedValue, incorrectPassword, config)).rejects.toThrow();
  });
});
