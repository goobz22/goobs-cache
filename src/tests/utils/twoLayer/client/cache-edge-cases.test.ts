import fs from 'fs';
import {
  TwoLayerClientCache,
  ClientStorage,
  ServerStorage,
} from '../../../../utils/twoLayerCache.client';
import { CacheConfig, StringValue, CacheResult } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerClientCache - Edge Cases', () => {
  let clientStorage: ClientStorage;
  let serverStorage: ServerStorage;
  let defaultConfig: CacheConfig;
  let cache: TwoLayerClientCache;
  let logStream: fs.WriteStream;
  let log: (message: string) => void;

  beforeEach(() => {
    clientStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    };

    serverStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      subscribeToUpdates: jest.fn(),
    };

    defaultConfig = mockCacheConfig;
    cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);

    logStream = createLogStream('cache-edge-cases-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should handle setting data with a past expiration date', async () => {
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const pastDate = new Date(Date.now() - 1000);

    await cache.set('testId', 'testStore', testData, pastDate);

    expect(clientStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, pastDate);
    expect(serverStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, pastDate);
    log('Data set with past expiration date');
  });

  it('should handle getting data with a past expiration date', async () => {
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const pastDate = new Date(Date.now() - 1000);
    const cacheResult: CacheResult = {
      identifier: 'testId',
      storeName: 'testStore',
      value: testData,
      expirationDate: pastDate,
      lastUpdatedDate: pastDate,
      lastAccessedDate: pastDate,
      getHitCount: 1,
      setHitCount: 1,
    };

    clientStorage.get = jest.fn().mockImplementation((id, store, callback) => {
      callback(cacheResult);
    });

    const result = await new Promise<CacheResult | undefined>((resolve) => {
      cache.get('testId', 'testStore', resolve);
    });

    expect(result).toBeUndefined();
    expect(clientStorage.get).toHaveBeenCalledWith('testId', 'testStore', expect.any(Function));
    expect(serverStorage.get).toHaveBeenCalledWith('testId', 'testStore');
    log('Expired data handled correctly');
  });

  it('should handle setting data with very long strings', async () => {
    const longString = 'a'.repeat(1000000);
    const testData: StringValue = { type: 'string', value: longString };
    const expirationDate = new Date(Date.now() + 1000);

    await cache.set('testId', 'testStore', testData, expirationDate);

    expect(clientStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    expect(serverStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    log('Long string data set successfully');
  });

  it('should handle setting and getting data with special characters in keys', async () => {
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const specialKey = 'test/key@with#special&characters';
    const expirationDate = new Date(Date.now() + 1000);

    await cache.set(specialKey, 'testStore', testData, expirationDate);

    clientStorage.get = jest.fn().mockImplementation((id, store, callback) => {
      callback({
        identifier: id,
        storeName: store,
        value: testData,
        expirationDate,
        lastUpdatedDate: expirationDate,
        lastAccessedDate: expirationDate,
        getHitCount: 1,
        setHitCount: 1,
      });
    });

    const result = await new Promise<CacheResult | undefined>((resolve) => {
      cache.get(specialKey, 'testStore', resolve);
    });

    expect(result?.value).toEqual(testData);
    expect(clientStorage.set).toHaveBeenCalledWith(
      specialKey,
      'testStore',
      testData,
      expirationDate,
    );
    expect(clientStorage.get).toHaveBeenCalledWith(specialKey, 'testStore', expect.any(Function));
    log('Data with special characters in keys handled correctly');
  });

  it('should handle race condition between set and get', async () => {
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    const setPromise = cache.set('testId', 'testStore', testData, expirationDate);

    clientStorage.get = jest.fn().mockImplementation((id, store, callback) => {
      callback(undefined);
    });

    serverStorage.get = jest.fn().mockResolvedValue({
      identifier: 'testId',
      storeName: 'testStore',
      value: testData,
      expirationDate,
      lastUpdatedDate: expirationDate,
      lastAccessedDate: expirationDate,
      getHitCount: 1,
      setHitCount: 1,
    });

    const getPromise = new Promise<CacheResult | undefined>((resolve) => {
      cache.get('testId', 'testStore', resolve);
    });

    const [setResult, getResult] = await Promise.all([setPromise, getPromise]);

    expect(setResult).toBeUndefined();
    expect(getResult?.value).toEqual(testData);
    log('Race condition between set and get handled correctly');
  });
});
