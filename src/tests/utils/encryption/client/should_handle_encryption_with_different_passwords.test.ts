import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('different-passwords-encryption.log');
const log = createLogger(logStream);

describe('Encryption with Different Passwords', () => {
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

  const testDifferentPasswords = async (password1: string, password2: string): Promise<void> => {
    const originalData: string = 'Test data for different passwords';
    const data: Uint8Array = new TextEncoder().encode(originalData);

    const config1: CacheConfig = {
      ...mockCacheConfig,
      encryptionPassword: password1,
    };

    const config2: CacheConfig = {
      ...mockCacheConfig,
      encryptionPassword: password2,
    };

    const encryptedValue1: EncryptedValue = await encryptPromise(data, config1);
    const encryptedValue2: EncryptedValue = await encryptPromise(data, config2);

    expect(encryptedValue1).not.toEqual(encryptedValue2);

    const decryptedData1: Uint8Array | null = await decryptPromise(encryptedValue1, config1);
    const decryptedData2: Uint8Array | null = await decryptPromise(encryptedValue2, config2);

    expect(decryptedData1).not.toBeNull();
    expect(decryptedData2).not.toBeNull();

    if (decryptedData1 !== null && decryptedData2 !== null) {
      const decryptedString1: string = new TextDecoder().decode(decryptedData1);
      const decryptedString2: string = new TextDecoder().decode(decryptedData2);

      expect(decryptedString1).toEqual(originalData);
      expect(decryptedString2).toEqual(originalData);
    }

    const failedDecrypt1: Uint8Array | null = await decryptPromise(encryptedValue1, config2);
    const failedDecrypt2: Uint8Array | null = await decryptPromise(encryptedValue2, config1);

    expect(failedDecrypt1).toBeNull();
    expect(failedDecrypt2).toBeNull();
  };

  it('should encrypt differently with different passwords', async () => {
    await expect(testDifferentPasswords('password1', 'password2')).resolves.not.toThrow();
  });

  it('should encrypt differently with similar passwords', async () => {
    await expect(testDifferentPasswords('password', 'password1')).resolves.not.toThrow();
  });

  it('should encrypt differently with passwords of different lengths', async () => {
    await expect(testDifferentPasswords('short', 'muchlongerpassword')).resolves.not.toThrow();
  });

  it('should encrypt differently with passwords containing special characters', async () => {
    await expect(testDifferentPasswords('p@ssw0rd!', 'P@ssw0rd!')).resolves.not.toThrow();
  });

  it('should encrypt differently with unicode passwords', async () => {
    await expect(testDifferentPasswords('パスワード', 'пароль')).resolves.not.toThrow();
  });
});
