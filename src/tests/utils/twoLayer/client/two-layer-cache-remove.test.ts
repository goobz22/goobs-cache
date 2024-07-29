import fs from 'fs';
import {
  TwoLayerClientCache,
  ClientStorage,
  ServerStorage,
} from '../../../../utils/twoLayerCache.client';
import { CacheConfig, StringValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerClientCache - remove', () => {
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

    logStream = createLogStream('two-layer-cache-remove-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should remove data from both client and server storage', () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    cache.set('testId', 'testStore', testData, expirationDate);
    cache.remove('testId', 'testStore');

    expect(clientStorage.get).not.toHaveBeenCalled();
    expect(clientStorage.set).toHaveBeenCalledTimes(1);
    expect(clientStorage.remove).toHaveBeenCalledWith('testId', 'testStore');
    expect(clientStorage.clear).not.toHaveBeenCalled();

    expect(serverStorage.get).not.toHaveBeenCalled();
    expect(serverStorage.set).toHaveBeenCalledTimes(1);
    expect(serverStorage.remove).toHaveBeenCalledWith('testId', 'testStore');
    expect(serverStorage.clear).not.toHaveBeenCalled();

    log('Data removed from both client and server storage');
  });

  it('should handle remove when data does not exist', () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);

    cache.remove('testId', 'testStore');

    expect(clientStorage.get).not.toHaveBeenCalled();
    expect(clientStorage.set).not.toHaveBeenCalled();
    expect(clientStorage.remove).toHaveBeenCalledWith('testId', 'testStore');
    expect(clientStorage.clear).not.toHaveBeenCalled();

    expect(serverStorage.get).not.toHaveBeenCalled();
    expect(serverStorage.set).not.toHaveBeenCalled();
    expect(serverStorage.remove).toHaveBeenCalledWith('testId', 'testStore');
    expect(serverStorage.clear).not.toHaveBeenCalled();

    log('Remove handled when data does not exist');
  });
});
