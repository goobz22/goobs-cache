import fs from 'fs';
import {
  TwoLayerClientCache,
  ClientStorage,
  ServerStorage,
} from '../../../../utils/twoLayerCache.client';
import { CacheConfig, StringValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerClientCache - Integration', () => {
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

    logStream = createLogStream('cache-integration-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should set and get data from cache', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    cache.set('testId', 'testStore', testData, expirationDate);

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
    log('Data set and retrieved from cache');
  });

  it('should remove data from cache', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    cache.set('testId', 'testStore', testData, expirationDate);
    cache.remove('testId', 'testStore');

    const mockCallback = jest.fn();
    cache.get('testId', 'testStore', mockCallback);

    await new Promise(process.nextTick);

    expect(mockCallback).toHaveBeenCalledWith(undefined);
    log('Data removed from cache');
  });

  it('should clear cache', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    cache.set('testId1', 'testStore', testData, expirationDate);
    cache.set('testId2', 'testStore', testData, expirationDate);

    cache.clear();

    const mockCallback1 = jest.fn();
    cache.get('testId1', 'testStore', mockCallback1);

    const mockCallback2 = jest.fn();
    cache.get('testId2', 'testStore', mockCallback2);

    await new Promise(process.nextTick);

    expect(mockCallback1).toHaveBeenCalledWith(undefined);
    expect(mockCallback2).toHaveBeenCalledWith(undefined);
    log('Cache cleared');
  });

  it('should handle cache misses', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);

    const mockCallback = jest.fn();
    cache.get('testId', 'testStore', mockCallback);

    await new Promise(process.nextTick);

    expect(mockCallback).toHaveBeenCalledWith(undefined);
    log('Cache misses handled');
  });

  it('should update client cache when server cache is updated', () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const updatedData: StringValue = { type: 'string', value: 'updatedValue' };

    const unsubscribe = cache.subscribeToUpdates('testId', 'testStore', (data: StringValue) => {
      expect(data).toEqual(updatedData);
      expect(clientStorage.set).toHaveBeenCalledWith(
        'testId',
        'testStore',
        updatedData,
        expect.any(Date),
      );
    });

    serverStorage.subscribeToUpdates('testId', 'testStore', (serverData: StringValue) => {
      expect(serverData).toEqual(updatedData);
    });

    unsubscribe();
    log('Client cache updated when server cache is updated');
  });
});
