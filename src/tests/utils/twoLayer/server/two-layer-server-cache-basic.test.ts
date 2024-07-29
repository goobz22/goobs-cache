import fs from 'fs';
import { TwoLayerServerCache, ServerStorage } from '../../../../utils/twoLayerCache.server';
import { CacheConfig, StringValue, ListValue, HashValue, CacheResult } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerServerCache - Basic Operations', () => {
  let serverStorage: ServerStorage;
  let cache: TwoLayerServerCache;
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

    defaultConfig = mockCacheConfig;

    cache = new TwoLayerServerCache(defaultConfig, serverStorage);

    logStream = createLogStream('two-layer-server-cache-basic-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should set and get string value', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    await cache.set(testId, testStore, testData, expirationDate);

    const mockResult: CacheResult = {
      identifier: testId,
      storeName: testStore,
      value: testData,
      expirationDate,
      lastUpdatedDate: expect.any(Date),
      lastAccessedDate: expect.any(Date),
      getHitCount: 0,
      setHitCount: 1,
    };

    (serverStorage.get as jest.Mock).mockResolvedValue(mockResult);

    const result = await cache.get(testId, testStore);

    expect(serverStorage.set).toHaveBeenCalledWith(testId, testStore, testData, expirationDate);
    expect(result).toEqual(mockResult);
    log('String value set and get successfully');
  });

  it('should set and get list value', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: ListValue = { type: 'list', value: ['item1', 'item2'] };
    const expirationDate = new Date(Date.now() + 1000);

    await cache.set(testId, testStore, testData, expirationDate);

    const mockResult: CacheResult = {
      identifier: testId,
      storeName: testStore,
      value: testData,
      expirationDate,
      lastUpdatedDate: expect.any(Date),
      lastAccessedDate: expect.any(Date),
      getHitCount: 0,
      setHitCount: 1,
    };

    (serverStorage.get as jest.Mock).mockResolvedValue(mockResult);

    const result = await cache.get(testId, testStore);

    expect(serverStorage.set).toHaveBeenCalledWith(testId, testStore, testData, expirationDate);
    expect(result).toEqual(mockResult);
    log('List value set and get successfully');
  });

  it('should set and get hash value', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: HashValue = { type: 'hash', value: { key1: 'value1', key2: 'value2' } };
    const expirationDate = new Date(Date.now() + 1000);

    await cache.set(testId, testStore, testData, expirationDate);

    const mockResult: CacheResult = {
      identifier: testId,
      storeName: testStore,
      value: testData,
      expirationDate,
      lastUpdatedDate: expect.any(Date),
      lastAccessedDate: expect.any(Date),
      getHitCount: 0,
      setHitCount: 1,
    };

    (serverStorage.get as jest.Mock).mockResolvedValue(mockResult);

    const result = await cache.get(testId, testStore);

    expect(serverStorage.set).toHaveBeenCalledWith(testId, testStore, testData, expirationDate);
    expect(result).toEqual(mockResult);
    log('Hash value set and get successfully');
  });

  it('should remove value', async () => {
    const testId = 'testId';
    const testStore = 'testStore';

    await cache.remove(testId, testStore);

    expect(serverStorage.remove).toHaveBeenCalledWith(testId, testStore);
    log('Value removed successfully');
  });

  it('should clear cache', async () => {
    await cache.clear();

    expect(serverStorage.clear).toHaveBeenCalled();
    log('Cache cleared successfully');
  });

  it('should handle non-existent key', async () => {
    const testId = 'nonExistentId';
    const testStore = 'testStore';

    (serverStorage.get as jest.Mock).mockResolvedValue(undefined);

    const result = await cache.get(testId, testStore);

    expect(result).toBeUndefined();
    log('Non-existent key handled correctly');
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
      getHitCount: 0,
      setHitCount: 1,
    };

    (serverStorage.get as jest.Mock).mockResolvedValue(mockResult);

    const result = await cache.get(testId, testStore);

    expect(result).toBeUndefined();
    expect(serverStorage.remove).toHaveBeenCalledWith(testId, testStore);
    log('Expired value handled correctly');
  });

  it('should subscribe to updates', () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const listener = jest.fn();

    cache.subscribeToUpdates(testId, testStore, listener);

    expect(serverStorage.subscribeToUpdates).toHaveBeenCalledWith(
      testId,
      testStore,
      expect.any(Function),
    );
    log('Subscribed to updates successfully');
  });
});
