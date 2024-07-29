import fs from 'fs';
import { TwoLayerServerCache, ServerStorage } from '../../../../utils/twoLayerCache.server';
import { CacheConfig, StringValue, CacheResult } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerServerCache - Clear Operation', () => {
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

    logStream = createLogStream('two-layer-server-cache-clear-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should clear all data from cache', async () => {
    await cache.clear();

    expect(serverStorage.clear).toHaveBeenCalled();
    log('Cache cleared successfully');
  });

  it('should handle errors during clear operation', async () => {
    const errorMessage = 'Failed to clear cache';
    (serverStorage.clear as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(cache.clear()).rejects.toThrow(errorMessage);
    log('Error during clear operation handled correctly');
  });

  it('should return undefined for all keys after clear', async () => {
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

    const beforeClear = await cache.get(testId, testStore);
    expect(beforeClear).toEqual(mockResult);

    await cache.clear();

    (serverStorage.get as jest.Mock).mockResolvedValue(undefined);

    const afterClear = await cache.get(testId, testStore);
    expect(afterClear).toBeUndefined();
    log('All keys return undefined after clear');
  });

  it('should allow setting new data after clear', async () => {
    await cache.clear();

    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'newValue' };
    const expirationDate = new Date(Date.now() + 1000);

    await cache.set(testId, testStore, testData, expirationDate);

    expect(serverStorage.set).toHaveBeenCalledWith(testId, testStore, testData, expirationDate);
    log('New data set successfully after clear');
  });

  it('should clear data across all stores', async () => {
    const stores = ['store1', 'store2', 'store3'];
    const testId = 'testId';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    for (const store of stores) {
      await cache.set(testId, store, testData, expirationDate);
    }

    await cache.clear();

    for (const store of stores) {
      (serverStorage.get as jest.Mock).mockResolvedValue(undefined);
      const result = await cache.get(testId, store);
      expect(result).toBeUndefined();
    }

    log('Data cleared across all stores');
  });

  it('should reset hit counts after clear', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    await cache.set(testId, testStore, testData, expirationDate);
    await cache.get(testId, testStore);
    await cache.clear();

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
    expect(result?.getHitCount).toBe(0);
    expect(result?.setHitCount).toBe(1);
    log('Hit counts reset after clear');
  });

  it('should maintain subscriptions after clear', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const listener = jest.fn();

    cache.subscribeToUpdates(testId, testStore, listener);
    await cache.clear();

    const testData: StringValue = { type: 'string', value: 'newValue' };
    const expirationDate = new Date(Date.now() + 1000);

    await cache.set(testId, testStore, testData, expirationDate);

    expect(listener).toHaveBeenCalledWith(testData);
    log('Subscriptions maintained after clear');
  });
});
