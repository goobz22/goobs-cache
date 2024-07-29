import fs from 'fs';
import {
  TwoLayerClientCache,
  ClientStorage,
  ServerStorage,
} from '../../../../utils/twoLayerCache.client';
import { CacheConfig, StringValue, CacheResult } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerClientCache - Basic Operations', () => {
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

    logStream = createLogStream('two-layer-client-cache-basic-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should set data in both client and server storage', async () => {
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    await cache.set('testId', 'testStore', testData, expirationDate);

    expect(clientStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    expect(serverStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    log('Data set in both client and server storage');
  });

  it('should get data from client storage if available', async () => {
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();
    const cacheResult: CacheResult = {
      identifier: 'testId',
      storeName: 'testStore',
      value: testData,
      expirationDate,
      lastUpdatedDate: expirationDate,
      lastAccessedDate: expirationDate,
      getHitCount: 1,
      setHitCount: 1,
    };

    clientStorage.get = jest.fn().mockImplementation((id, store, callback) => {
      callback(cacheResult);
    });

    const result = await new Promise<CacheResult | undefined>((resolve) => {
      cache.get('testId', 'testStore', resolve);
    });

    expect(result).toEqual(cacheResult);
    expect(clientStorage.get).toHaveBeenCalledWith('testId', 'testStore', expect.any(Function));
    expect(serverStorage.get).not.toHaveBeenCalled();
    log('Data retrieved from client storage');
  });

  it('should get data from server storage if not in client storage', async () => {
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();
    const cacheResult: CacheResult = {
      identifier: 'testId',
      storeName: 'testStore',
      value: testData,
      expirationDate,
      lastUpdatedDate: expirationDate,
      lastAccessedDate: expirationDate,
      getHitCount: 1,
      setHitCount: 1,
    };

    clientStorage.get = jest.fn().mockImplementation((id, store, callback) => {
      callback(undefined);
    });
    serverStorage.get = jest.fn().mockResolvedValue(cacheResult);

    const result = await new Promise<CacheResult | undefined>((resolve) => {
      cache.get('testId', 'testStore', resolve);
    });

    expect(result).toEqual(cacheResult);
    expect(clientStorage.get).toHaveBeenCalledWith('testId', 'testStore', expect.any(Function));
    expect(serverStorage.get).toHaveBeenCalledWith('testId', 'testStore');
    expect(clientStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    log('Data retrieved from server storage and set in client storage');
  });

  it('should remove data from both client and server storage', async () => {
    await cache.remove('testId', 'testStore');

    expect(clientStorage.remove).toHaveBeenCalledWith('testId', 'testStore');
    expect(serverStorage.remove).toHaveBeenCalledWith('testId', 'testStore');
    log('Data removed from both client and server storage');
  });

  it('should clear data from both client and server storage', async () => {
    await cache.clear();

    expect(clientStorage.clear).toHaveBeenCalled();
    expect(serverStorage.clear).toHaveBeenCalled();
    log('Data cleared from both client and server storage');
  });
});
