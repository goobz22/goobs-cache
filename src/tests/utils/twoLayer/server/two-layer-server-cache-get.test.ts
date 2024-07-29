import fs from 'fs';
import { TwoLayerServerCache, ServerStorage } from '../../../../utils/twoLayerCache.server';
import { CacheConfig, StringValue, ListValue, HashValue, CacheResult } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerServerCache - Get Operation', () => {
  let serverStorage: ServerStorage;
  let cache: TwoLayerServerCache;
  let defaultConfig: CacheConfig;
  let logStream: fs.WriteStream;

  beforeEach(() => {
    serverStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      subscribeToUpdates: jest.fn(),
    };

    defaultConfig = mockCacheConfig;

    cache = new TwoLayerServerCache(defaultConfig, serverStorage);

    logStream = createLogStream('two-layer-server-cache-get-test.log');
    createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should get string value', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    const mockResult: CacheResult = {
      identifier: testId,
      storeName: testStore,
      value: testData,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (serverStorage.get as jest.Mock).mockResolvedValue(mockResult);

    const result = await cache.get(testId, testStore);

    expect(serverStorage.get).toHaveBeenCalledWith(testId, testStore);
    expect(result).toEqual(mockResult);
  });

  it('should get list value', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: ListValue = { type: 'list', value: ['item1', 'item2'] };
    const expirationDate = new Date(Date.now() + 1000);

    const mockResult: CacheResult = {
      identifier: testId,
      storeName: testStore,
      value: testData,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (serverStorage.get as jest.Mock).mockResolvedValue(mockResult);

    const result = await cache.get(testId, testStore);

    expect(serverStorage.get).toHaveBeenCalledWith(testId, testStore);
    expect(result).toEqual(mockResult);
  });

  it('should get hash value', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: HashValue = { type: 'hash', value: { key1: 'value1', key2: 'value2' } };
    const expirationDate = new Date(Date.now() + 1000);

    const mockResult: CacheResult = {
      identifier: testId,
      storeName: testStore,
      value: testData,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (serverStorage.get as jest.Mock).mockResolvedValue(mockResult);

    const result = await cache.get(testId, testStore);

    expect(serverStorage.get).toHaveBeenCalledWith(testId, testStore);
    expect(result).toEqual(mockResult);
  });

  it('should return undefined for non-existent key', async () => {
    const testId = 'nonExistentId';
    const testStore = 'testStore';

    (serverStorage.get as jest.Mock).mockResolvedValue(undefined);

    const result = await cache.get(testId, testStore);

    expect(serverStorage.get).toHaveBeenCalledWith(testId, testStore);
    expect(result).toBeUndefined();
  });

  it('should handle expired value', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() - 1000); // Expired

    const mockResult: CacheResult = {
      identifier: testId,
      storeName: testStore,
      value: testData,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    };

    (serverStorage.get as jest.Mock).mockResolvedValue(mockResult);

    const result = await cache.get(testId, testStore);

    expect(serverStorage.get).toHaveBeenCalledWith(testId, testStore);
    expect(result).toBeUndefined();
    expect(serverStorage.remove).toHaveBeenCalledWith(testId, testStore);
  });

  it('should update lastAccessedDate and getHitCount', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    const mockResult: CacheResult = {
      identifier: testId,
      storeName: testStore,
      value: testData,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(Date.now() - 1000),
      getHitCount: 1,
      setHitCount: 1,
    };

    (serverStorage.get as jest.Mock).mockResolvedValue(mockResult);

    await cache.get(testId, testStore);

    expect(serverStorage.set).toHaveBeenCalledWith(
      testId,
      testStore,
      testData,
      expirationDate,
      expect.objectContaining({
        lastAccessedDate: expect.any(Date),
        getHitCount: 2,
      }),
    );
  });

  it('should handle server storage errors', async () => {
    const testId = 'testId';
    const testStore = 'testStore';

    const error = new Error('Storage error');
    (serverStorage.get as jest.Mock).mockRejectedValue(error);

    await expect(cache.get(testId, testStore)).rejects.toThrow('Storage error');
  });
});
