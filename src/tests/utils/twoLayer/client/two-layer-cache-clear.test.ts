import fs from 'fs';
import {
  TwoLayerClientCache,
  ClientStorage,
  ServerStorage,
} from '../../../../utils/twoLayerCache.client';
import { CacheConfig, StringValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerClientCache - clear', () => {
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

    logStream = createLogStream('two-layer-cache-clear-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should clear all data from cache', () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData1: StringValue = { type: 'string', value: 'testValue1' };
    const testData2: StringValue = { type: 'string', value: 'testValue2' };
    const expirationDate = new Date();

    cache.set('testId1', 'testStore', testData1, expirationDate);
    cache.set('testId2', 'testStore', testData2, expirationDate);

    cache.clear();

    expect(clientStorage.get).not.toHaveBeenCalled();
    expect(clientStorage.set).toHaveBeenCalledTimes(2);
    expect(clientStorage.remove).not.toHaveBeenCalled();
    expect(clientStorage.clear).toHaveBeenCalledTimes(1);

    expect(serverStorage.get).not.toHaveBeenCalled();
    expect(serverStorage.set).toHaveBeenCalledTimes(2);
    expect(serverStorage.remove).not.toHaveBeenCalled();
    expect(serverStorage.clear).toHaveBeenCalledTimes(1);

    log('All data cleared from cache');
  });

  it('should handle clear when cache is empty', () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);

    cache.clear();

    expect(clientStorage.get).not.toHaveBeenCalled();
    expect(clientStorage.set).not.toHaveBeenCalled();
    expect(clientStorage.remove).not.toHaveBeenCalled();
    expect(clientStorage.clear).toHaveBeenCalledTimes(1);

    expect(serverStorage.get).not.toHaveBeenCalled();
    expect(serverStorage.set).not.toHaveBeenCalled();
    expect(serverStorage.remove).not.toHaveBeenCalled();
    expect(serverStorage.clear).toHaveBeenCalledTimes(1);

    log('Clear handled when cache is empty');
  });
});
