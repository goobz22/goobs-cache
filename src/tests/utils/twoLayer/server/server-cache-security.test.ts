import fs from 'fs';
import { TwoLayerServerCache, ServerStorage } from '../../../../utils/twoLayerCache.server';
import { CacheConfig, StringValue, EncryptedValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';
import { encrypt, decrypt } from '../../../../utils/encryption.server';

jest.mock('../../../../utils/encryption.server');

describe('TwoLayerServerCache - Security', () => {
  let serverStorage: ServerStorage;
  let defaultConfig: CacheConfig;
  let logStream: fs.WriteStream;
  let cache: TwoLayerServerCache;

  beforeEach(() => {
    serverStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      subscribeToUpdates: jest.fn(),
    };

    defaultConfig = {
      ...mockCacheConfig,
      algorithm: 'aes-256-gcm',
      keySize: 256,
      encryptionPassword: 'testPassword',
    };

    logStream = createLogStream('server-cache-security-test.log');
    createLogger(logStream);

    cache = new TwoLayerServerCache(defaultConfig, serverStorage);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should encrypt data before storing', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    const mockEncryptedData: EncryptedValue = {
      type: 'encrypted',
      encryptedData: new Uint8Array([1, 2, 3]),
      iv: new Uint8Array([4, 5, 6]),
      salt: new Uint8Array([7, 8, 9]),
      authTag: new Uint8Array([10, 11, 12]),
      encryptionKey: new Uint8Array([13, 14, 15]),
    };

    (encrypt as jest.Mock).mockResolvedValue(mockEncryptedData);

    await cache.set(testId, testStore, testData, expirationDate);

    expect(encrypt).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      defaultConfig.encryptionPassword,
      defaultConfig,
    );
    expect(serverStorage.set).toHaveBeenCalledWith(
      testId,
      testStore,
      mockEncryptedData,
      expirationDate,
    );
  });

  it('should decrypt data after retrieving', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    const mockEncryptedData: EncryptedValue = {
      type: 'encrypted',
      encryptedData: new Uint8Array([1, 2, 3]),
      iv: new Uint8Array([4, 5, 6]),
      salt: new Uint8Array([7, 8, 9]),
      authTag: new Uint8Array([10, 11, 12]),
      encryptionKey: new Uint8Array([13, 14, 15]),
    };

    (serverStorage.get as jest.Mock).mockResolvedValue({
      value: mockEncryptedData,
      expirationDate,
    });

    (decrypt as jest.Mock).mockResolvedValue(new TextEncoder().encode(JSON.stringify(testData)));

    const result = await cache.get(testId, testStore);

    expect(decrypt).toHaveBeenCalledWith(
      mockEncryptedData,
      defaultConfig.encryptionPassword,
      defaultConfig,
    );
    expect(result).toEqual(expect.objectContaining({ value: testData }));
  });

  it('should handle decryption errors', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const expirationDate = new Date(Date.now() + 1000);

    const mockEncryptedData: EncryptedValue = {
      type: 'encrypted',
      encryptedData: new Uint8Array([1, 2, 3]),
      iv: new Uint8Array([4, 5, 6]),
      salt: new Uint8Array([7, 8, 9]),
      authTag: new Uint8Array([10, 11, 12]),
      encryptionKey: new Uint8Array([13, 14, 15]),
    };

    (serverStorage.get as jest.Mock).mockResolvedValue({
      value: mockEncryptedData,
      expirationDate,
    });

    (decrypt as jest.Mock).mockRejectedValue(new Error('Decryption failed'));

    await expect(cache.get(testId, testStore)).rejects.toThrow('Decryption failed');
  });

  it('should use different IVs for each encryption', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    const mockEncryptedData1: EncryptedValue = {
      type: 'encrypted',
      encryptedData: new Uint8Array([1, 2, 3]),
      iv: new Uint8Array([4, 5, 6]),
      salt: new Uint8Array([7, 8, 9]),
      authTag: new Uint8Array([10, 11, 12]),
      encryptionKey: new Uint8Array([13, 14, 15]),
    };

    const mockEncryptedData2: EncryptedValue = {
      type: 'encrypted',
      encryptedData: new Uint8Array([16, 17, 18]),
      iv: new Uint8Array([19, 20, 21]),
      salt: new Uint8Array([22, 23, 24]),
      authTag: new Uint8Array([25, 26, 27]),
      encryptionKey: new Uint8Array([28, 29, 30]),
    };

    (encrypt as jest.Mock)
      .mockResolvedValueOnce(mockEncryptedData1)
      .mockResolvedValueOnce(mockEncryptedData2);

    await cache.set(testId, testStore, testData, expirationDate);
    await cache.set(`${testId}2`, testStore, testData, expirationDate);

    expect(mockEncryptedData1.iv).not.toEqual(mockEncryptedData2.iv);
  });
});
