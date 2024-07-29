import { encrypt, decrypt } from '../../../../utils/encryption.server';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('changing-passwords-encryption.log');
const log = createLogger(logStream);

describe('Changing Passwords for Encryption and Decryption', () => {
  beforeAll(() => {
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  it('should encrypt with one password and fail to decrypt with another', async () => {
    const originalData = new TextEncoder().encode('Secret message');
    const password1 = 'password1';
    const password2 = 'password2';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue = await encrypt(originalData, password1, config);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.type).toBe('encrypted');

    await expect(decrypt(encryptedValue, password2, config)).rejects.toThrow();
  });

  it('should allow re-encryption with a new password', async () => {
    const originalData = new TextEncoder().encode('Data to be re-encrypted');
    const oldPassword = 'oldPassword';
    const newPassword = 'newPassword';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue1 = await encrypt(originalData, oldPassword, config);
    const decryptedData1 = await decrypt(encryptedValue1, oldPassword, config);

    const encryptedValue2 = await encrypt(decryptedData1, newPassword, config);
    const decryptedData2 = await decrypt(encryptedValue2, newPassword, config);

    expect(decryptedData2).toEqual(originalData);
  });

  it('should handle password changes with different lengths', async () => {
    const originalData = new TextEncoder().encode('Testing different password lengths');
    const shortPassword = 'short';
    const longPassword = 'thisIsAMuchLongerPasswordForTesting';
    const config: CacheConfig = { ...mockCacheConfig, algorithm: 'aes-256-gcm' };

    const encryptedValue1 = await encrypt(originalData, shortPassword, config);
    const decryptedData1 = await decrypt(encryptedValue1, shortPassword, config);

    const encryptedValue2 = await encrypt(decryptedData1, longPassword, config);
    const decryptedData2 = await decrypt(encryptedValue2, longPassword, config);

    expect(decryptedData2).toEqual(originalData);
  });
});
