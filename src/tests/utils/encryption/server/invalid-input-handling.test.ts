import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig, EncryptedValue } from '../../../../types';

const logStream: WriteStream = createLogStream('invalid-input-handling-encryption.log');
const log = createLogger(logStream);

describe('Invalid Input Handling in Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should throw an error when encrypting with an empty password', async () => {
    const data = new TextEncoder().encode('Test data');
    const emptyPassword = '';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    await expect(encrypt(data, emptyPassword, config)).rejects.toThrow();
  });

  it('should throw an error when decrypting with an empty password', async () => {
    const data = new TextEncoder().encode('Test data');
    const validPassword = 'valid-password';
    const emptyPassword = '';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(data, validPassword, config);

    await expect(decrypt(encryptedValue, emptyPassword, config)).rejects.toThrow();
  });

  it('should throw an error when encrypting with an unsupported algorithm', async () => {
    const data = new TextEncoder().encode('Test data');
    const password = 'test-password';
    const invalidConfig: CacheConfig = {
      ...mockCacheConfig,
      algorithm: 'unsupported-algo' as 'aes-256-gcm',
    };

    await expect(encrypt(data, password, invalidConfig)).rejects.toThrow();
  });

  it('should throw an error when decrypting with an unsupported algorithm', async () => {
    const data = new TextEncoder().encode('Test data');
    const password = 'test-password';
    const validConfig: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };
    const invalidConfig: CacheConfig = {
      ...mockCacheConfig,
      algorithm: 'unsupported-algo' as 'aes-256-gcm',
    };

    const encryptedValue = await encrypt(data, password, validConfig);

    await expect(decrypt(encryptedValue, password, invalidConfig)).rejects.toThrow();
  });

  it('should throw an error when decrypting with invalid encrypted data', async () => {
    const password = 'test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };
    const invalidEncryptedValue: EncryptedValue = {
      type: 'encrypted',
      encryptedData: new Uint8Array([1, 2, 3]),
      iv: new Uint8Array(16),
      salt: new Uint8Array(16),
      authTag: new Uint8Array(16),
      encryptionKey: new Uint8Array(32),
    };

    await expect(decrypt(invalidEncryptedValue, password, config)).rejects.toThrow();
  });

  it('should throw an error when decrypting with mismatched IV length', async () => {
    const data = new TextEncoder().encode('Test data');
    const password = 'test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(data, password, config);
    const invalidEncryptedValue: EncryptedValue = {
      ...encryptedValue,
      iv: new Uint8Array(8), // Invalid IV length
    };

    await expect(decrypt(invalidEncryptedValue, password, config)).rejects.toThrow();
  });

  it('should throw an error when decrypting with mismatched salt length', async () => {
    const data = new TextEncoder().encode('Test data');
    const password = 'test-password';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(data, password, config);
    const invalidEncryptedValue: EncryptedValue = {
      ...encryptedValue,
      salt: new Uint8Array(8), // Invalid salt length
    };

    await expect(decrypt(invalidEncryptedValue, password, config)).rejects.toThrow();
  });
});
