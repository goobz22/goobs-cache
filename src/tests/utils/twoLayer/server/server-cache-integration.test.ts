import fs from 'fs';
import { TwoLayerServerCache, ServerStorage } from '../../../../utils/twoLayerCache.server';
import {
  CacheConfig,
  StringValue,
  ListValue,
  HashValue,
  JSONValue,
  CacheResult,
  EncryptedValue,
} from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';
import { encrypt, decrypt } from '../../../../utils/encryption.server';
import { compressData, decompressData } from '../../../../utils/compression.server';

jest.mock('../../../../utils/encryption.server');
jest.mock('../../../../utils/Compression.server');

describe('TwoLayerServerCache - Integration', () => {
  let serverStorage: ServerStorage;
  let defaultConfig: CacheConfig;
  let logStream: fs.WriteStream;
  let log: (message: string) => void;

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
      compressionLevel: 1,
      algorithm: 'aes-256-gcm',
      keySize: 256,
    };

    logStream = createLogStream('server-cache-integration-test.log');
    log = createLogger(logStream);

    (encrypt as jest.Mock).mockImplementation(async (value) => {
      const encryptedData = Buffer.from(`encrypted_${value}`);
      return {
        type: 'encrypted',
        encryptedData: new Uint8Array(encryptedData),
        iv: new Uint8Array(16),
        salt: new Uint8Array(16),
        authTag: new Uint8Array(16),
        encryptionKey: new Uint8Array(32),
      };
    });

    (decrypt as jest.Mock).mockImplementation(async (value) => {
      const decrypted = Buffer.from(value.encryptedData).toString().slice(10); // Remove 'encrypted_'
      return Buffer.from(decrypted);
    });

    (compressData as jest.Mock).mockImplementation(async (value) => {
      return Buffer.from(`compressed_${value}`);
    });

    (decompressData as jest.Mock).mockImplementation(async (value) => {
      return value.toString().slice(11); // Remove 'compressed_'
    });
  });

  afterEach(() => {
    logStream.end();
  });

  it('should integrate encryption, compression, and storage for string values', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    await cache.set('testId', 'testStore', testData, expirationDate);

    expect(compressData).toHaveBeenCalledWith(JSON.stringify(testData));
    expect(encrypt).toHaveBeenCalled();
    expect(serverStorage.set).toHaveBeenCalled();

    const mockResult: CacheResult = {
      identifier: 'testId',
      storeName: 'testStore',
      value: {
        type: 'encrypted',
        encryptedData: new Uint8Array(
          Buffer.from('encrypted_compressed_{"type":"string","value":"testValue"}'),
        ),
        iv: new Uint8Array(16),
        salt: new Uint8Array(16),
        authTag: new Uint8Array(16),
        encryptionKey: new Uint8Array(32),
      },
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 1,
    };

    serverStorage.get = jest.fn().mockResolvedValue(mockResult);

    const result = await cache.get('testId', 'testStore');
    expect(decrypt).toHaveBeenCalled();
    expect(decompressData).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ value: testData }));

    log('String value integration test passed');
  });

  it('should integrate encryption, compression, and storage for list values', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: ListValue = { type: 'list', value: ['item1', 'item2', 'item3'] };
    const expirationDate = new Date(Date.now() + 1000);

    await cache.set('testId', 'testStore', testData, expirationDate);

    expect(compressData).toHaveBeenCalledWith(JSON.stringify(testData));
    expect(encrypt).toHaveBeenCalled();
    expect(serverStorage.set).toHaveBeenCalled();

    const mockResult: CacheResult = {
      identifier: 'testId',
      storeName: 'testStore',
      value: {
        type: 'encrypted',
        encryptedData: new Uint8Array(
          Buffer.from('encrypted_compressed_{"type":"list","value":["item1","item2","item3"]}'),
        ),
        iv: new Uint8Array(16),
        salt: new Uint8Array(16),
        authTag: new Uint8Array(16),
        encryptionKey: new Uint8Array(32),
      },
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 1,
    };

    serverStorage.get = jest.fn().mockResolvedValue(mockResult);

    const result = await cache.get('testId', 'testStore');
    expect(decrypt).toHaveBeenCalled();
    expect(decompressData).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ value: testData }));

    log('List value integration test passed');
  });

  it('should integrate encryption, compression, and storage for hash values', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: HashValue = { type: 'hash', value: { key1: 'value1', key2: 'value2' } };
    const expirationDate = new Date(Date.now() + 1000);

    await cache.set('testId', 'testStore', testData, expirationDate);

    expect(compressData).toHaveBeenCalledWith(JSON.stringify(testData));
    expect(encrypt).toHaveBeenCalled();
    expect(serverStorage.set).toHaveBeenCalled();

    const mockResult: CacheResult = {
      identifier: 'testId',
      storeName: 'testStore',
      value: {
        type: 'encrypted',
        encryptedData: new Uint8Array(
          Buffer.from(
            'encrypted_compressed_{"type":"hash","value":{"key1":"value1","key2":"value2"}}',
          ),
        ),
        iv: new Uint8Array(16),
        salt: new Uint8Array(16),
        authTag: new Uint8Array(16),
        encryptionKey: new Uint8Array(32),
      },
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 1,
    };

    serverStorage.get = jest.fn().mockResolvedValue(mockResult);

    const result = await cache.get('testId', 'testStore');
    expect(decrypt).toHaveBeenCalled();
    expect(decompressData).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ value: testData }));

    log('Hash value integration test passed');
  });

  it('should integrate encryption, compression, and storage for JSON values', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: JSONValue = {
      type: 'json',
      value: {
        stringProp: 'value',
        numberProp: 42,
        booleanProp: true,
        arrayProp: [1, 2, 3],
        objectProp: { nestedKey: 'nestedValue' },
      },
    };
    const expirationDate = new Date(Date.now() + 1000);

    await cache.set('testId', 'testStore', testData, expirationDate);

    expect(compressData).toHaveBeenCalledWith(JSON.stringify(testData));
    expect(encrypt).toHaveBeenCalled();
    expect(serverStorage.set).toHaveBeenCalled();

    const mockResult: CacheResult = {
      identifier: 'testId',
      storeName: 'testStore',
      value: {
        type: 'encrypted',
        encryptedData: new Uint8Array(
          Buffer.from(`encrypted_compressed_${JSON.stringify(testData)}`),
        ),
        iv: new Uint8Array(16),
        salt: new Uint8Array(16),
        authTag: new Uint8Array(16),
        encryptionKey: new Uint8Array(32),
      },
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 1,
    };

    serverStorage.get = jest.fn().mockResolvedValue(mockResult);

    const result = await cache.get('testId', 'testStore');
    expect(decrypt).toHaveBeenCalled();
    expect(decompressData).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ value: testData }));

    log('JSON value integration test passed');
  });

  it('should integrate subscription mechanism with encryption and compression', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    const listener = jest.fn();
    cache.subscribeToUpdates('testId', 'testStore', listener);

    await cache.set('testId', 'testStore', testData, expirationDate);

    expect(compressData).toHaveBeenCalledWith(JSON.stringify(testData));
    expect(encrypt).toHaveBeenCalled();
    expect(serverStorage.set).toHaveBeenCalled();

    // Simulate a server-side update
    const updatedData: StringValue = { type: 'string', value: 'updatedValue' };
    const mockEncryptedUpdatedData: EncryptedValue = {
      type: 'encrypted',
      encryptedData: new Uint8Array(
        Buffer.from('encrypted_compressed_{"type":"string","value":"updatedValue"}'),
      ),
      iv: new Uint8Array(16),
      salt: new Uint8Array(16),
      authTag: new Uint8Array(16),
      encryptionKey: new Uint8Array(32),
    };

    // Call the subscribed listener with the mock encrypted data
    const subscriptionCallback = (serverStorage.subscribeToUpdates as jest.Mock).mock.calls[0][2];
    subscriptionCallback(mockEncryptedUpdatedData);

    expect(decrypt).toHaveBeenCalledWith(
      mockEncryptedUpdatedData,
      defaultConfig.encryptionPassword,
      defaultConfig,
    );
    expect(decompressData).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledWith(updatedData);

    log('Subscription mechanism integration test passed');
  });

  it('should handle errors in integrated operations', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    // Simulate an encryption error
    (encrypt as jest.Mock).mockRejectedValueOnce(new Error('Encryption failed'));

    await expect(cache.set('testId', 'testStore', testData, expirationDate)).rejects.toThrow(
      'Encryption failed',
    );

    // Simulate a decryption error
    const mockResult: CacheResult = {
      identifier: 'testId',
      storeName: 'testStore',
      value: {
        type: 'encrypted',
        encryptedData: new Uint8Array(Buffer.from('invalid_encrypted_data')),
        iv: new Uint8Array(16),
        salt: new Uint8Array(16),
        authTag: new Uint8Array(16),
        encryptionKey: new Uint8Array(32),
      },
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 1,
    };

    serverStorage.get = jest.fn().mockResolvedValue(mockResult);
    (decrypt as jest.Mock).mockRejectedValueOnce(new Error('Decryption failed'));

    await expect(cache.get('testId', 'testStore')).rejects.toThrow('Decryption failed');

    log('Error handling in integrated operations test passed');
  });
});
