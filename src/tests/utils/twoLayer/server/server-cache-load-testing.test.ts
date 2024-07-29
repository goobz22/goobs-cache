import fs from 'fs';
import { TwoLayerServerCache, ServerStorage } from '../../../../utils/twoLayerCache.server';
import { CacheConfig, StringValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerServerCache - Load Testing', () => {
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

    logStream = createLogStream('server-cache-load-testing-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should handle a large number of concurrent set operations', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const operations = 1000;
    const concurrentSets = [];

    for (let i = 0; i < operations; i++) {
      const testData: StringValue = { type: 'string', value: `testValue${i}` };
      const expirationDate = new Date(Date.now() + 1000);
      concurrentSets.push(cache.set(`testId${i}`, 'testStore', testData, expirationDate));
    }

    await Promise.all(concurrentSets);
    expect(serverStorage.set).toHaveBeenCalledTimes(operations);
    log(`Handled ${operations} concurrent set operations`);
  });

  it('should handle a large number of concurrent get operations', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const operations = 1000;
    const concurrentGets = [];

    for (let i = 0; i < operations; i++) {
      concurrentGets.push(cache.get(`testId${i}`, 'testStore'));
    }

    await Promise.all(concurrentGets);
    expect(serverStorage.get).toHaveBeenCalledTimes(operations);
    log(`Handled ${operations} concurrent get operations`);
  });

  it('should handle a large number of concurrent remove operations', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const operations = 1000;
    const concurrentRemoves = [];

    for (let i = 0; i < operations; i++) {
      concurrentRemoves.push(cache.remove(`testId${i}`, 'testStore'));
    }

    await Promise.all(concurrentRemoves);
    expect(serverStorage.remove).toHaveBeenCalledTimes(operations);
    log(`Handled ${operations} concurrent remove operations`);
  });

  it('should handle a mix of concurrent operations', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const operations = 1000;
    const concurrentOperations = [];

    for (let i = 0; i < operations; i++) {
      const operationType = i % 3;
      switch (operationType) {
        case 0: {
          const testData: StringValue = { type: 'string', value: `testValue${i}` };
          const expirationDate = new Date(Date.now() + 1000);
          concurrentOperations.push(cache.set(`testId${i}`, 'testStore', testData, expirationDate));
          break;
        }
        case 1:
          concurrentOperations.push(cache.get(`testId${i}`, 'testStore'));
          break;
        case 2:
          concurrentOperations.push(cache.remove(`testId${i}`, 'testStore'));
          break;
      }
    }

    await Promise.all(concurrentOperations);
    expect(serverStorage.set).toHaveBeenCalledTimes(operations / 3);
    expect(serverStorage.get).toHaveBeenCalledTimes(operations / 3);
    expect(serverStorage.remove).toHaveBeenCalledTimes(operations / 3);
    log(`Handled ${operations} mixed concurrent operations`);
  });

  it('should handle rapid successive operations', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const operations = 1000;

    for (let i = 0; i < operations; i++) {
      const testData: StringValue = { type: 'string', value: `testValue${i}` };
      const expirationDate = new Date(Date.now() + 1000);
      await cache.set(`testId${i}`, 'testStore', testData, expirationDate);
      await cache.get(`testId${i}`, 'testStore');
      await cache.remove(`testId${i}`, 'testStore');
    }

    expect(serverStorage.set).toHaveBeenCalledTimes(operations);
    expect(serverStorage.get).toHaveBeenCalledTimes(operations);
    expect(serverStorage.remove).toHaveBeenCalledTimes(operations);
    log(`Handled ${operations * 3} rapid successive operations`);
  });

  it('should handle a large number of subscriptions', () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const subscriptions = 1000;

    for (let i = 0; i < subscriptions; i++) {
      cache.subscribeToUpdates(`testId${i}`, 'testStore', jest.fn());
    }

    expect(serverStorage.subscribeToUpdates).toHaveBeenCalledTimes(subscriptions);
    log(`Handled ${subscriptions} subscriptions`);
  });
});
