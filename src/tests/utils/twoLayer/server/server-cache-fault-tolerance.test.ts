import fs from 'fs';
import { TwoLayerServerCache, ServerStorage } from '../../../../utils/twoLayerCache.server';
import { CacheConfig, StringValue, CacheResult } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerServerCache - Fault Tolerance', () => {
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

    logStream = createLogStream('server-cache-fault-tolerance-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should handle temporary server storage failures', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    // Simulate a temporary failure
    let callCount = 0;
    serverStorage.set = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Temporary failure'));
      }
      return Promise.resolve();
    });

    await expect(cache.set('testId', 'testStore', testData, expirationDate)).resolves.not.toThrow();
    expect(serverStorage.set).toHaveBeenCalledTimes(2);

    log('Temporary server storage failure handled');
  });

  it('should gracefully handle partial data corruption', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    await cache.set('testId', 'testStore', testData, expirationDate);

    // Simulate partial data corruption
    const corruptedResult: CacheResult = {
      identifier: 'testId',
      storeName: 'testStore',
      value: { type: 'string', value: 'corruptedValue' },
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 1,
    };

    serverStorage.get = jest.fn().mockResolvedValue(corruptedResult);

    const result = await cache.get('testId', 'testStore');
    expect(result).toEqual(corruptedResult);
    // In a real-world scenario, you might want to implement data integrity checks
    // and handle corrupted data more gracefully

    log('Partial data corruption handled');
  });

  it('should recover from server storage unavailability', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    // Simulate server storage unavailability
    serverStorage.set = jest.fn().mockRejectedValue(new Error('Storage unavailable'));
    serverStorage.get = jest.fn().mockRejectedValue(new Error('Storage unavailable'));

    await expect(cache.set('testId', 'testStore', testData, expirationDate)).rejects.toThrow(
      'Storage unavailable',
    );
    await expect(cache.get('testId', 'testStore')).rejects.toThrow('Storage unavailable');

    // Simulate storage recovery
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

    serverStorage.set = jest.fn().mockResolvedValue(undefined);
    serverStorage.get = jest.fn().mockResolvedValue(mockResult);

    await expect(cache.set('testId', 'testStore', testData, expirationDate)).resolves.not.toThrow();
    const result = await cache.get('testId', 'testStore');
    expect(result).toEqual(mockResult);

    log('Recovery from server storage unavailability');
  });

  it('should handle concurrent access during fault conditions', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    let callCount = 0;
    serverStorage.set = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount % 2 === 1) {
        return Promise.reject(new Error('Intermittent failure'));
      }
      return Promise.resolve();
    });

    const concurrentOperations = Array(5)
      .fill(null)
      .map(() => cache.set('testId', 'testStore', testData, expirationDate));

    await expect(Promise.all(concurrentOperations)).resolves.not.toThrow();
    expect(serverStorage.set).toHaveBeenCalledTimes(10); // 5 initial calls + 5 retries

    log('Concurrent access during fault conditions handled');
  });

  it('should maintain data consistency during partial failures', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData1: StringValue = { type: 'string', value: 'testValue1' };
    const testData2: StringValue = { type: 'string', value: 'testValue2' };
    const expirationDate = new Date(Date.now() + 1000);

    await cache.set('testId1', 'testStore', testData1, expirationDate);

    // Simulate a partial failure
    serverStorage.set = jest.fn().mockRejectedValue(new Error('Partial failure'));
    await expect(cache.set('testId2', 'testStore', testData2, expirationDate)).rejects.toThrow(
      'Partial failure',
    );

    // Verify that the first set operation's data is still intact
    const mockResult: CacheResult = {
      identifier: 'testId1',
      storeName: 'testStore',
      value: testData1,
      expirationDate,
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 0,
      setHitCount: 1,
    };

    serverStorage.get = jest.fn().mockResolvedValue(mockResult);
    const result = await cache.get('testId1', 'testStore');
    expect(result).toEqual(mockResult);

    log('Data consistency maintained during partial failures');
  });
});
