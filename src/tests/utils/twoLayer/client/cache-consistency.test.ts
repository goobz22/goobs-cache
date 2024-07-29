import fs from 'fs';
import {
  TwoLayerClientCache,
  ClientStorage,
  ServerStorage,
} from '../../../../utils/twoLayerCache.client';
import { CacheConfig, StringValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerClientCache - Cache Consistency', () => {
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

    logStream = createLogStream('cache-consistency-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should maintain consistency between client and server cache on set', () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const expirationDate = new Date();

    const testData: StringValue = { type: 'string', value: 'testValue' };
    cache.set('testId', 'testStore', testData, expirationDate);

    expect(clientStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    expect(serverStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    log('Consistency maintained between client and server cache on set');
  });

  it('should maintain consistency between client and server cache on remove', () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);

    cache.remove('testId', 'testStore');

    expect(clientStorage.remove).toHaveBeenCalledWith('testId', 'testStore');
    expect(serverStorage.remove).toHaveBeenCalledWith('testId', 'testStore');
    log('Consistency maintained between client and server cache on remove');
  });

  it('should maintain consistency between client and server cache on clear', () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);

    cache.clear();

    expect(clientStorage.clear).toHaveBeenCalled();
    expect(serverStorage.clear).toHaveBeenCalled();
    log('Consistency maintained between client and server cache on clear');
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

  it('should ensure data consistency when getting from client and server cache', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const mockCallback = jest.fn();

    const testData: StringValue = { type: 'string', value: 'testValue' };

    clientStorage.get = jest.fn((id, store, callback) => callback(undefined));
    serverStorage.get = jest.fn().mockResolvedValue({
      identifier: 'testId',
      storeName: 'testStore',
      value: testData,
      expirationDate: new Date(),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    cache.get('testId', 'testStore', mockCallback);

    await new Promise(process.nextTick);

    expect(serverStorage.get).toHaveBeenCalledWith('testId', 'testStore');
    expect(clientStorage.set).toHaveBeenCalledWith(
      'testId',
      'testStore',
      testData,
      expect.any(Date),
    );
    expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ value: testData }));
    log('Data consistency ensured when getting from client and server cache');
  });
});
