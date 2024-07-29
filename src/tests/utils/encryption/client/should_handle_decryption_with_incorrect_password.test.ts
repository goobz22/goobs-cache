import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('handle-decryption-incorrect-password.log');
const log = createLogger(logStream);

describe('Decryption with Incorrect Password', () => {
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

  it('should fail to decrypt when using an incorrect password', async () => {
    const originalData = 'This is sensitive data';
    const dataBuffer = new TextEncoder().encode(originalData);

    log('Encrypting data with correct password');
    const encryptedValue = await encryptPromise(dataBuffer, mockCacheConfig);

    log('Attempting to decrypt with incorrect password');
    const incorrectConfig: CacheConfig = {
      ...mockCacheConfig,
      encryptionPassword: 'wrongPassword',
    };

    const decryptedData = await decryptPromise(encryptedValue, incorrectConfig);

    expect(decryptedData).toBeNull();
    log('Decryption with incorrect password failed as expected');
  });

  it('should successfully decrypt with correct password after failed attempt', async () => {
    const originalData = 'This data should only be decrypted with the correct password';
    const dataBuffer = new TextEncoder().encode(originalData);

    log('Encrypting data with correct password');
    const encryptedValue = await encryptPromise(dataBuffer, mockCacheConfig);

    log('Attempting to decrypt with incorrect password');
    const incorrectConfig: CacheConfig = {
      ...mockCacheConfig,
      encryptionPassword: 'wrongPassword',
    };

    const failedDecryption = await decryptPromise(encryptedValue, incorrectConfig);
    expect(failedDecryption).toBeNull();
    log('Decryption with incorrect password failed as expected');

    log('Attempting to decrypt with correct password');
    const successfulDecryption = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(successfulDecryption).not.toBeNull();
    expect(successfulDecryption).toEqual(dataBuffer);
    log('Decryption with correct password succeeded');
  });

  it('should handle multiple decryption attempts with various passwords', async () => {
    const originalData = 'Data for multiple decryption attempts';
    const dataBuffer = new TextEncoder().encode(originalData);

    log('Encrypting data with correct password');
    const encryptedValue = await encryptPromise(dataBuffer, mockCacheConfig);

    const wrongPasswords = ['wrongPassword1', 'wrongPassword2', 'wrongPassword3'];

    for (const wrongPassword of wrongPasswords) {
      const config: CacheConfig = {
        ...mockCacheConfig,
        encryptionPassword: wrongPassword,
      };

      log(`Attempting to decrypt with password: ${wrongPassword}`);
      const decryptedData = await decryptPromise(encryptedValue, config);
      expect(decryptedData).toBeNull();
      log('Decryption failed as expected');
    }

    log('Attempting to decrypt with correct password');
    const correctDecryption = await decryptPromise(encryptedValue, mockCacheConfig);
    expect(correctDecryption).not.toBeNull();
    expect(correctDecryption).toEqual(dataBuffer);
    log('Decryption with correct password succeeded');
  });
});
