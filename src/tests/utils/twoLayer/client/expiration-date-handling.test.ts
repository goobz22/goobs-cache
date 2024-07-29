import fs from 'fs';
import {
  TwoLayerClientCache,
  ClientStorage,
  ServerStorage,
} from '../../../../utils/twoLayerCache.client';
import { CacheConfig, StringValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerClientCache - Expiration Date Handling', () => {
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

    logStream = createLogStream('expiration-date-handling-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should set data with expiration date', () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 60000);

    cache.set('testId', 'testStore', testData, expirationDate);

    expect(clientStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    expect(serverStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);

    log('Data set with expiration date');
  });

  it('should return data before expiration', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 60000);

    clientStorage.get = jest.fn((id, store, callback) => {
      callback({
        identifier: id,
        storeName: store,
        value: testData,
        expirationDate,
        lastUpdatedDate: new Date(),
        lastAccessedDate: new Date(),
        getHitCount: 1,
        setHitCount: 1,
      });
    });

    const mockCallback = jest.fn();
    cache.get('testId', 'testStore', mockCallback);

    await new Promise(process.nextTick);

    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'testId',
        storeName: 'testStore',
        value: testData,
        expirationDate: expirationDate,
      }),
    );

    log('Data returned before expiration');
  });

  it('should not return data after expiration', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expiredDate = new Date(Date.now() - 60000);

    clientStorage.get = jest.fn((id, store, callback) => {
      callback({
        identifier: id,
        storeName: store,
        value: testData,
        expirationDate: expiredDate,
        lastUpdatedDate: new Date(),
        lastAccessedDate: new Date(),
        getHitCount: 1,
        setHitCount: 1,
      });
    });
    serverStorage.get = jest.fn().mockResolvedValue(undefined);

    const mockCallback = jest.fn();
    cache.get('testId', 'testStore', mockCallback);

    await new Promise(process.nextTick);

    expect(mockCallback).toHaveBeenCalledWith(undefined);

    log('Data not returned after expiration');
  });
});
