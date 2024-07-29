import fs from 'fs';
import { TwoLayerServerCache, ServerStorage } from '../../../../utils/twoLayerCache.server';
import { CacheConfig, StringValue, CacheResult } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerServerCache - Expiration Date Handling', () => {
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

    defaultConfig = mockCacheConfig;

    logStream = createLogStream('server-cache-expiration-date-handling-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should set and respect expiration dates', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000); // 1 second in the future

    await cache.set('testId', 'testStore', testData, expirationDate);

    const mockResult: CacheResult = {
      identifier: 'testId',
      storeName: 'testStore',
      value: testData,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 1,
    };

    serverStorage.get = jest.fn().mockResolvedValue(mockResult);

    // Before expiration
    let result = await cache.get('testId', 'testStore');
    expect(result).toEqual(mockResult);

    // After expiration
    jest.advanceTimersByTime(1001);
    serverStorage.get = jest.fn().mockResolvedValue(undefined);
    result = await cache.get('testId', 'testStore');
    expect(result).toBeUndefined();

    log('Expiration dates set and respected');
  });

  it('should handle setting items with immediate expiration', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const immediateExpirationDate = new Date();

    await cache.set('testId', 'testStore', testData, immediateExpirationDate);

    serverStorage.get = jest.fn().mockResolvedValue(undefined);
    const result = await cache.get('testId', 'testStore');
    expect(result).toBeUndefined();

    log('Immediate expiration handled');
  });

  it('should handle setting items with far future expiration', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const farFutureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365); // 1 year in the future

    await cache.set('testId', 'testStore', testData, farFutureDate);

    const mockResult: CacheResult = {
      identifier: 'testId',
      storeName: 'testStore',
      value: testData,
      expirationDate: farFutureDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 1,
    };

    serverStorage.get = jest.fn().mockResolvedValue(mockResult);
    const result = await cache.get('testId', 'testStore');
    expect(result).toEqual(mockResult);

    log('Far future expiration handled');
  });

  it('should update expiration date when setting an existing item', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const initialExpirationDate = new Date(Date.now() + 1000); // 1 second in the future
    const updatedExpirationDate = new Date(Date.now() + 2000); // 2 seconds in the future

    await cache.set('testId', 'testStore', testData, initialExpirationDate);
    await cache.set('testId', 'testStore', testData, updatedExpirationDate);

    const mockResult: CacheResult = {
      identifier: 'testId',
      storeName: 'testStore',
      value: testData,
      expirationDate: updatedExpirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 2,
    };

    serverStorage.get = jest.fn().mockResolvedValue(mockResult);
    const result = await cache.get('testId', 'testStore');
    expect(result).toEqual(mockResult);

    log('Expiration date updated for existing item');
  });

  it('should handle expiration during concurrent operations', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 500); // 500ms in the future

    await cache.set('testId', 'testStore', testData, expirationDate);

    const mockResult: CacheResult = {
      identifier: 'testId',
      storeName: 'testStore',
      value: testData,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 1,
    };

    serverStorage.get = jest.fn().mockResolvedValue(mockResult);

    const operation1 = cache.get('testId', 'testStore');
    jest.advanceTimersByTime(501);
    serverStorage.get = jest.fn().mockResolvedValue(undefined);
    const operation2 = cache.get('testId', 'testStore');

    const [result1, result2] = await Promise.all([operation1, operation2]);
    expect(result1).toEqual(mockResult);
    expect(result2).toBeUndefined();

    log('Expiration during concurrent operations handled');
  });
});
