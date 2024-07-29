import fs from 'fs';
import { TwoLayerServerCache, ServerStorage } from '../../../../utils/twoLayerCache.server';
import { CacheConfig, StringValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerServerCache - Concurrent Operations', () => {
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

    logStream = createLogStream('server-cache-concurrent-operations-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should handle concurrent set operations', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    const concurrentSetPromises = [];

    for (let i = 0; i < 5; i++) {
      concurrentSetPromises.push(cache.set(`testId${i}`, 'testStore', testData, expirationDate));
    }

    await Promise.all(concurrentSetPromises);

    expect(serverStorage.set).toHaveBeenCalledTimes(5);

    log('Concurrent set operations handled');
  });

  it('should handle concurrent get operations', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    for (let i = 0; i < 5; i++) {
      await cache.set(`testId${i}`, 'testStore', testData, expirationDate);
    }

    const concurrentGetPromises = [];

    for (let i = 0; i < 5; i++) {
      concurrentGetPromises.push(cache.get(`testId${i}`, 'testStore'));
    }

    const results = await Promise.all(concurrentGetPromises);

    expect(serverStorage.get).toHaveBeenCalledTimes(5);
    expect(results.every((result) => result?.value === testData.value)).toBe(true);

    log('Concurrent get operations handled');
  });

  it('should handle concurrent remove operations', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    for (let i = 0; i < 5; i++) {
      await cache.set(`testId${i}`, 'testStore', testData, expirationDate);
    }

    const concurrentRemovePromises = [];

    for (let i = 0; i < 5; i++) {
      concurrentRemovePromises.push(cache.remove(`testId${i}`, 'testStore'));
    }

    await Promise.all(concurrentRemovePromises);

    expect(serverStorage.remove).toHaveBeenCalledTimes(5);

    log('Concurrent remove operations handled');
  });
});
