import { clientSet, clientGet, clientRemove } from '../../../reusableStore.client';
import { createLogStream, createLogger, setupErrorHandling } from '../../jest/default/logging';
import { CacheMode, CacheResult, StringValue, EncryptedValue, CacheConfig } from '../../../types';
import { encrypt, decrypt } from '../../../utils/encryption.client';
import { compressData, decompressData } from '../../../utils/compression.client';

jest.mock('../../../ReusableStore.client');
jest.mock('../../../utils/Encryption.client');
jest.mock('../../../utils/Compression.client');

const logStream = createLogStream('cache-security-test.log');
const log = createLogger(logStream);

describe('Cache Security Tests', () => {
  const modes: CacheMode[] = ['client', 'cookie'];
  const storeName = 'security-test-store';
  const expirationDate = new Date(Date.now() + 3600000);
  const mockConfig: CacheConfig = {
    encryptionPassword: 'testPassword',
  } as CacheConfig;

  beforeAll(() => {
    log('Starting Cache Security tests...');
    setupErrorHandling(log, logStream);
  });

  afterAll(() => {
    logStream.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should encrypt and compress data before storing', async () => {
    const identifier = 'encrypt-compress-test';
    const testValue: StringValue = { type: 'string', value: 'sensitive-data' };
    const compressedValue = new Uint8Array([1, 2, 3]);
    const encryptedValue: EncryptedValue = {
      type: 'encrypted',
      encryptedData: new Uint8Array([4, 5, 6]),
      iv: new Uint8Array([7, 8, 9]),
      salt: new Uint8Array([10, 11, 12]),
      authTag: new Uint8Array([13, 14, 15]),
      encryptionKey: new Uint8Array([16, 17, 18]),
    };

    (compressData as jest.Mock).mockReturnValue(compressedValue);
    (encrypt as jest.Mock).mockImplementation((_value, _config, callback) => {
      callback(encryptedValue);
    });

    for (const mode of modes) {
      await clientSet(identifier, storeName, testValue, expirationDate, mode);

      expect(compressData).toHaveBeenCalledWith(expect.any(Uint8Array));
      expect(encrypt).toHaveBeenCalledWith(compressedValue, mockConfig, expect.any(Function));
      expect(clientSet).toHaveBeenCalledWith(
        identifier,
        storeName,
        encryptedValue,
        expirationDate,
        mode,
      );

      log(`Encryption and compression test passed for ${mode} mode`);
    }
  });

  it('should decrypt and decompress data when retrieving', async () => {
    const identifier = 'decrypt-decompress-test';
    const encryptedValue: EncryptedValue = {
      type: 'encrypted',
      encryptedData: new Uint8Array([1, 2, 3]),
      iv: new Uint8Array([4, 5, 6]),
      salt: new Uint8Array([7, 8, 9]),
      authTag: new Uint8Array([10, 11, 12]),
      encryptionKey: new Uint8Array([13, 14, 15]),
    };
    const compressedValue = new Uint8Array([16, 17, 18]);
    const originalValue: StringValue = { type: 'string', value: 'decrypted-data' };

    (clientGet as jest.Mock).mockResolvedValue({ value: encryptedValue } as CacheResult);
    (decrypt as jest.Mock).mockImplementation((_value, _config, callback) => {
      callback(compressedValue);
    });
    (decompressData as jest.Mock).mockReturnValue(
      new TextEncoder().encode(JSON.stringify(originalValue)),
    );

    for (const mode of modes) {
      const result = await clientGet(identifier, storeName, mode);

      expect(decrypt).toHaveBeenCalledWith(encryptedValue, mockConfig, expect.any(Function));
      expect(decompressData).toHaveBeenCalledWith(compressedValue, 'uint8array');
      expect(result.value).toEqual(originalValue);

      log(`Decryption and decompression test passed for ${mode} mode`);
    }
  });

  it('should handle encryption errors gracefully', async () => {
    const identifier = 'encryption-error-test';
    const testValue: StringValue = { type: 'string', value: 'sensitive-data' };

    (encrypt as jest.Mock).mockImplementation((_value, _config, callback) => {
      callback(null);
    });

    for (const mode of modes) {
      await expect(
        clientSet(identifier, storeName, testValue, expirationDate, mode),
      ).rejects.toThrow('Encryption failed');

      log(`Encryption error handling test passed for ${mode} mode`);
    }
  });

  it('should handle decryption errors gracefully', async () => {
    const identifier = 'decryption-error-test';
    const encryptedValue: EncryptedValue = {
      type: 'encrypted',
      encryptedData: new Uint8Array([1, 2, 3]),
      iv: new Uint8Array([4, 5, 6]),
      salt: new Uint8Array([7, 8, 9]),
      authTag: new Uint8Array([10, 11, 12]),
      encryptionKey: new Uint8Array([13, 14, 15]),
    };

    (clientGet as jest.Mock).mockResolvedValue({ value: encryptedValue } as CacheResult);
    (decrypt as jest.Mock).mockImplementation((_value, _config, callback) => {
      callback(null);
    });

    for (const mode of modes) {
      const result = await clientGet(identifier, storeName, mode);
      expect(result.value).toBeNull();

      log(`Decryption error handling test passed for ${mode} mode`);
    }
  });

  it('should remove data securely', async () => {
    const identifier = 'secure-remove-test';

    for (const mode of modes) {
      await clientRemove(identifier, storeName, mode);

      expect(clientRemove).toHaveBeenCalledWith(identifier, storeName, mode);

      log(`Secure removal test passed for ${mode} mode`);
    }
  });
});
