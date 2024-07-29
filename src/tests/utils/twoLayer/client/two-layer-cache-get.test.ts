import fs from 'fs';
import {
  TwoLayerClientCache,
  ClientStorage,
  ServerStorage,
} from '../../../../utils/twoLayerCache.client';
import { CacheConfig, StringValue, CacheResult } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerClientCache - get', () => {
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

    logStream = createLogStream('two-layer-cache-get-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should get data from client storage', () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();
    const expectedResult: CacheResult = {
      identifier: 'testId',
      storeName: 'testStore',
      value: testData,
      expirationDate: expirationDate,
      lastUpdatedDate: expirationDate,
      lastAccessedDate: expirationDate,
      getHitCount: 1,
      setHitCount: 1,
    };

    clientStorage.get = jest.fn((id, store, callback) => {
      callback(expectedResult);
    });

    const mockCallback = jest.fn();
    cache.get('testId', 'testStore', mockCallback);

    expect(clientStorage.get).toHaveBeenCalledWith('testId', 'testStore', expect.any(Function));
    expect(serverStorage.get).not.toHaveBeenCalled();
    expect(mockCallback).toHaveBeenCalledWith(expectedResult);

    log('Data retrieved from client storage');
  });

  it('should get data from server storage when not found in client storage', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();
    const expectedResult: CacheResult = {
      identifier: 'testId',
      storeName: 'testStore',
      value: testData,
      expirationDate: expirationDate,
      lastUpdatedDate: expirationDate,
      lastAccessedDate: expirationDate,
      getHitCount: 1,
      setHitCount: 1,
    };

    clientStorage.get = jest.fn((id, store, callback) => {
      callback(undefined);
    });
    serverStorage.get = jest.fn().mockResolvedValue(expectedResult);

    const mockCallback = jest.fn();
    cache.get('testId', 'testStore', mockCallback);

    await new Promise(process.nextTick);

    expect(clientStorage.get).toHaveBeenCalledWith('testId', 'testStore', expect.any(Function));
    expect(serverStorage.get).toHaveBeenCalledWith('testId', 'testStore');
    expect(clientStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    expect(mockCallback).toHaveBeenCalledWith(expectedResult);

    log('Data retrieved from server storage when not found in client storage');
  });

  it('should return undefined when data is not found in both client and server storage', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);

    clientStorage.get = jest.fn((id, store, callback) => {
      callback(undefined);
    });
    serverStorage.get = jest.fn().mockResolvedValue(undefined);

    const mockCallback = jest.fn();
    cache.get('testId', 'testStore', mockCallback);

    await new Promise(process.nextTick);

    expect(clientStorage.get).toHaveBeenCalledWith('testId', 'testStore', expect.any(Function));
    expect(serverStorage.get).toHaveBeenCalledWith('testId', 'testStore');
    expect(clientStorage.set).not.toHaveBeenCalled();
    expect(mockCallback).toHaveBeenCalledWith(undefined);

    log('Undefined returned when data is not found in both client and server storage');
  });
});
