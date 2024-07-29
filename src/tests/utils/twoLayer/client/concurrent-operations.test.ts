import fs from 'fs';
import {
  TwoLayerClientCache,
  ClientStorage,
  ServerStorage,
} from '../../../../utils/twoLayerCache.client';
import { CacheConfig, StringValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerClientCache - Concurrent Operations', () => {
  let clientStorage: ClientStorage;
  let serverStorage: ServerStorage;
  let defaultConfig: CacheConfig;
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

    logStream = createLogStream('concurrent-operations-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should handle concurrent get operations', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };

    const mockGetFromServer = jest.fn().mockResolvedValue({
      identifier: 'testId',
      storeName: 'testStore',
      value: testData,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    serverStorage.get = mockGetFromServer;

    const concurrentGetPromises = [];

    for (let i = 0; i < 5; i++) {
      concurrentGetPromises.push(
        new Promise<void>((resolve) => {
          cache.get('testId', 'testStore', (result) => {
            expect(result?.value).toEqual(testData);
            resolve();
          });
        }),
      );
    }

    await Promise.all(concurrentGetPromises);

    expect(mockGetFromServer).toHaveBeenCalledTimes(1);

    log('Concurrent get operations handled');
  });

  it('should handle concurrent set operations', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    const concurrentSetPromises = [];

    for (let i = 0; i < 5; i++) {
      concurrentSetPromises.push(
        new Promise<void>((resolve) => {
          cache.set(`testId${i}`, 'testStore', testData, expirationDate);
          resolve();
        }),
      );
    }

    await Promise.all(concurrentSetPromises);

    expect(clientStorage.set).toHaveBeenCalledTimes(5);
    expect(serverStorage.set).toHaveBeenCalledTimes(5);

    log('Concurrent set operations handled');
  });

  it('should handle concurrent remove operations', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);

    const concurrentRemovePromises = [];

    for (let i = 0; i < 5; i++) {
      concurrentRemovePromises.push(
        new Promise<void>((resolve) => {
          cache.remove(`testId${i}`, 'testStore');
          resolve();
        }),
      );
    }

    await Promise.all(concurrentRemovePromises);

    expect(clientStorage.remove).toHaveBeenCalledTimes(5);
    expect(serverStorage.remove).toHaveBeenCalledTimes(5);

    log('Concurrent remove operations handled');
  });
});
