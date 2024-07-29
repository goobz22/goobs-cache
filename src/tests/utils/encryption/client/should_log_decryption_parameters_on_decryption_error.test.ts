import { encrypt, decrypt } from '../../../../utils/encryption.client';
import {
  createLogStream,
  createLogger,
  setupErrorHandling,
  mockCacheConfig,
} from '../../../jest/default/logging';
import { WriteStream } from 'fs';
import { EncryptedValue, CacheConfig } from '../../../../types';

const logStream: WriteStream = createLogStream('decryption-error-logging.log');
const log = createLogger(logStream);

describe('Log Decryption Parameters on Decryption Error', () => {
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

  it('should log decryption parameters when decryption fails', async () => {
    const originalData = new TextEncoder().encode('Test data');
    const encryptedValue = await encryptPromise(originalData, mockCacheConfig);

    // Modify the encrypted value to cause a decryption error
    const modifiedEncryptedValue: EncryptedValue = {
      ...encryptedValue,
      encryptedData: new Uint8Array([...encryptedValue.encryptedData].reverse()),
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const decryptedData = await decryptPromise(modifiedEncryptedValue, mockCacheConfig);

    expect(decryptedData).toBeNull();
    expect(consoleSpy).toHaveBeenCalledTimes(6);
    expect(consoleSpy).toHaveBeenNthCalledWith(1, 'Decryption error:');
    expect(consoleSpy).toHaveBeenNthCalledWith(2, 'Decryption parameters:');
    expect(consoleSpy).toHaveBeenNthCalledWith(3, 'Key:', expect.any(Uint8Array));
    expect(consoleSpy).toHaveBeenNthCalledWith(4, 'IV:', expect.any(Uint8Array));
    expect(consoleSpy).toHaveBeenNthCalledWith(5, 'Data:', expect.any(Uint8Array));
    expect(consoleSpy).toHaveBeenNthCalledWith(6, 'Auth Tag:', expect.any(Uint8Array));

    consoleSpy.mockRestore();
  });

  it('should not log decryption parameters when decryption succeeds', async () => {
    const originalData = new TextEncoder().encode('Test data');
    const encryptedValue = await encryptPromise(originalData, mockCacheConfig);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const decryptedData = await decryptPromise(encryptedValue, mockCacheConfig);

    expect(decryptedData).not.toBeNull();
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should log encrypted value on decryption failure', async () => {
    const originalData = new TextEncoder().encode('Test data');
    const encryptedValue = await encryptPromise(originalData, mockCacheConfig);

    // Modify the encrypted value to cause a decryption error
    const modifiedEncryptedValue: EncryptedValue = {
      ...encryptedValue,
      authTag: new Uint8Array([...encryptedValue.authTag].reverse()),
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const decryptedData = await decryptPromise(modifiedEncryptedValue, mockCacheConfig);

    expect(decryptedData).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Decryption failed. Encrypted value:',
      modifiedEncryptedValue,
    );

    consoleSpy.mockRestore();
  });
});
