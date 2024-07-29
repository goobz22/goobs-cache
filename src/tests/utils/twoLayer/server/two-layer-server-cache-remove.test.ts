import fs from 'fs';
import { TwoLayerServerCache, ServerStorage } from '../../../../utils/twoLayerCache.server';
import { CacheConfig, StringValue, CacheResult } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerServerCache - Remove Operation', () => {
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

    logStream = createLogStream('two-layer-server-cache-remove-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should remove existing data', async () => {
    const testId = 'testId';
    const testStore = 'testStore';

    await cache.remove(testId, testStore);

    expect(serverStorage.remove).toHaveBeenCalledWith(testId, testStore);
    log('Existing data removed successfully');
  });

  it('should not throw error when removing non-existent data', async () => {
    const testId = 'nonExistentId';
    const testStore = 'testStore';

    (serverStorage.remove as jest.Mock).mockResolvedValue(undefined);

    await expect(cache.remove(testId, testStore)).resolves.not.toThrow();
    expect(serverStorage.remove).toHaveBeenCalledWith(testId, testStore);
    log('Non-existent data removal handled gracefully');
  });

  it('should handle server storage errors during remove', async () => {
    const testId = 'testId';
    const testStore = 'testStore';

    const error = new Error('Storage error');
    (serverStorage.remove as jest.Mock).mockRejectedValue(error);

    await expect(cache.remove(testId, testStore)).rejects.toThrow('Storage error');
    log('Server storage error handled correctly during remove');
  });

  it('should remove data from specific store only', async () => {
    const testId = 'testId';
    const store1 = 'store1';
    const store2 = 'store2';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    const mockResult: CacheResult = {
      identifier: testId,
      storeName: store2,
      value: testData,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 1,
    };

    (serverStorage.get as jest.Mock).mockResolvedValue(mockResult);

    await cache.remove(testId, store1);

    expect(serverStorage.remove).toHaveBeenCalledWith(testId, store1);
    expect(serverStorage.remove).not.toHaveBeenCalledWith(testId, store2);

    const result = await cache.get(testId, store2);
    expect(result).toEqual(mockResult);

    log('Data removed from specific store only');
  });

  it('should trigger subscribed listeners on remove', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const listener = jest.fn();

    cache.subscribeToUpdates(testId, testStore, listener);

    await cache.remove(testId, testStore);

    expect(listener).toHaveBeenCalledWith(undefined);
    log('Subscribed listeners triggered on remove');
  });

  it('should remove all data with the same identifier across stores', async () => {
    const testId = 'testId';
    const stores = ['store1', 'store2', 'store3'];

    await Promise.all(stores.map((store) => cache.remove(testId, store)));

    stores.forEach((store) => {
      expect(serverStorage.remove).toHaveBeenCalledWith(testId, store);
    });

    log('Data removed from all stores for given identifier');
  });

  it('should not affect other data during removal', async () => {
    const testId1 = 'testId1';
    const testId2 = 'testId2';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    const mockResult: CacheResult = {
      identifier: testId2,
      storeName: testStore,
      value: testData,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 1,
    };

    (serverStorage.get as jest.Mock).mockResolvedValue(mockResult);

    await cache.remove(testId1, testStore);

    const result = await cache.get(testId2, testStore);
    expect(result).toEqual(mockResult);

    log('Other data unaffected by removal operation');
  });

  it('should handle removal of expired data', async () => {
    const testId = 'testId';
    const testStore = 'testStore';
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expiredDate = new Date(Date.now() - 1000);

    const mockResult: CacheResult = {
      identifier: testId,
      storeName: testStore,
      value: testData,
      expirationDate: expiredDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 1,
    };

    (serverStorage.get as jest.Mock).mockResolvedValue(mockResult);

    await cache.remove(testId, testStore);

    expect(serverStorage.remove).toHaveBeenCalledWith(testId, testStore);
    log('Expired data removed successfully');
  });
});
