import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('handle-changing-passwords-encryption.log');
const log = createLogger(logStream);

describe('Encryption and Decryption with Changing Passwords', () => {
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

  const testPasswordChange = async (
    initialPassword: string,
    newPassword: string,
    originalData: string,
  ): Promise<void> => {
    const data: Uint8Array = new TextEncoder().encode(originalData);

    log(`Encrypting with initial password: ${initialPassword}`);

    const initialConfig: CacheConfig = {
      ...mockCacheConfig,
      encryptionPassword: initialPassword,
    };

    const encryptedValue: EncryptedValue = await encryptPromise(data, initialConfig);

    expect(encryptedValue).toBeDefined();
    expect(encryptedValue.encryptedData).toBeDefined();
    expect(encryptedValue.encryptedData.byteLength).toBeGreaterThan(0);
    expect(encryptedValue.iv).toBeDefined();
    expect(encryptedValue.iv.byteLength).toBe(12);
    expect(encryptedValue.salt).toBeDefined();
    expect(encryptedValue.salt.byteLength).toBe(16);
    expect(encryptedValue.authTag).toBeDefined();
    expect(encryptedValue.authTag.byteLength).toBe(16);

    log(`Decrypting with new password: ${newPassword}`);
    const newConfig: CacheConfig = {
      ...mockCacheConfig,
      encryptionPassword: newPassword,
    };

    const decryptedData: Uint8Array | null = await decryptPromise(encryptedValue, newConfig);

    expect(decryptedData).toBeNull();
    log('Decryption with new password failed as expected');

    log('Decrypting with original password');
    const correctDecryptedData: Uint8Array | null = await decryptPromise(
      encryptedValue,
      initialConfig,
    );

    expect(correctDecryptedData).not.toBeNull();
    expect(correctDecryptedData).toBeInstanceOf(Uint8Array);

    if (correctDecryptedData !== null) {
      const decryptedString: string = new TextDecoder().decode(correctDecryptedData);
      expect(decryptedString).toEqual(originalData);
      log('Data successfully decrypted with original password');
    }
  };

  it('should handle changing from a short to a long password', async () => {
    await expect(
      testPasswordChange(
        'short',
        'thisIsAMuchLongerPassword123!@#',
        'Test data for password change',
      ),
    ).resolves.not.toThrow();
  });

  it('should handle changing from a long to a short password', async () => {
    await expect(
      testPasswordChange(
        'thisIsAVeryLongPasswordThatWeWillChange!@#$%^&*()',
        'tiny',
        'Another test for password change',
      ),
    ).resolves.not.toThrow();
  });

  it('should handle changing between passwords with special characters', async () => {
    await expect(
      testPasswordChange('p@ssw0rd!', 'n3w_P@ssw0rd#', 'Special characters password test'),
    ).resolves.not.toThrow();
  });

  it('should handle changing to a password with spaces', async () => {
    await expect(
      testPasswordChange('noSpaces', 'this has spaces', 'Password with spaces test'),
    ).resolves.not.toThrow();
  });

  it('should handle changing between numeric passwords', async () => {
    await expect(
      testPasswordChange('12345', '67890', 'Numeric password test'),
    ).resolves.not.toThrow();
  });

  it('should handle changing between case-sensitive passwords', async () => {
    await expect(
      testPasswordChange('CaseSensitive', 'cAsEsEnSiTiVe', 'Case sensitivity test'),
    ).resolves.not.toThrow();
  });

  it('should handle multiple password changes', async () => {
    const originalData = 'Multiple password changes test';
    const data: Uint8Array = new TextEncoder().encode(originalData);

    const passwords = ['first', 'second', 'third', 'fourth', 'fifth'];

    let currentEncryptedValue: EncryptedValue = await encryptPromise(data, {
      ...mockCacheConfig,
      encryptionPassword: passwords[0],
    });

    expect(currentEncryptedValue).toBeDefined();

    for (let i = 1; i < passwords.length; i++) {
      const newConfig: CacheConfig = {
        ...mockCacheConfig,
        encryptionPassword: passwords[i],
      };

      const decryptedData = await decryptPromise(currentEncryptedValue, newConfig);
      expect(decryptedData).toBeNull();

      const correctConfig: CacheConfig = {
        ...mockCacheConfig,
        encryptionPassword: passwords[i - 1],
      };
      const correctDecryptedData = await decryptPromise(currentEncryptedValue, correctConfig);
      expect(correctDecryptedData).not.toBeNull();
      expect(correctDecryptedData).toBeInstanceOf(Uint8Array);

      const decryptedString = new TextDecoder().decode(correctDecryptedData as Uint8Array);
      expect(decryptedString).toEqual(originalData);

      currentEncryptedValue = await encryptPromise(correctDecryptedData as Uint8Array, newConfig);
      expect(currentEncryptedValue).toBeDefined();
    }

    log('Successfully handled multiple password changes');
  });
});
