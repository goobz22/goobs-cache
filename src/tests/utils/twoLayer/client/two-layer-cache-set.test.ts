import fs from 'fs';
import {
  TwoLayerClientCache,
  ClientStorage,
  ServerStorage,
} from '../../../../utils/twoLayerCache.client';
import { CacheConfig, StringValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerClientCache - set', () => {
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

    logStream = createLogStream('two-layer-cache-set-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should set data in both client and server storage', () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    cache.set('testId', 'testStore', testData, expirationDate);

    expect(clientStorage.get).not.toHaveBeenCalled();
    expect(clientStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    expect(clientStorage.remove).not.toHaveBeenCalled();
    expect(clientStorage.clear).not.toHaveBeenCalled();

    expect(serverStorage.get).not.toHaveBeenCalled();
    expect(serverStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    expect(serverStorage.remove).not.toHaveBeenCalled();
    expect(serverStorage.clear).not.toHaveBeenCalled();

    log('Data set in both client and server storage');
  });

  it('should update data in both client and server storage', () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData1: StringValue = { type: 'string', value: 'testValue1' };
    const testData2: StringValue = { type: 'string', value: 'testValue2' };
    const expirationDate1 = new Date();
    const expirationDate2 = new Date(Date.now() + 60000);

    cache.set('testId', 'testStore', testData1, expirationDate1);
    cache.set('testId', 'testStore', testData2, expirationDate2);

    expect(clientStorage.get).not.toHaveBeenCalled();
    expect(clientStorage.set).toHaveBeenCalledTimes(2);
    expect(clientStorage.set).toHaveBeenCalledWith(
      'testId',
      'testStore',
      testData2,
      expirationDate2,
    );
    expect(clientStorage.remove).not.toHaveBeenCalled();
    expect(clientStorage.clear).not.toHaveBeenCalled();

    expect(serverStorage.get).not.toHaveBeenCalled();
    expect(serverStorage.set).toHaveBeenCalledTimes(2);
    expect(serverStorage.set).toHaveBeenCalledWith(
      'testId',
      'testStore',
      testData2,
      expirationDate2,
    );
    expect(serverStorage.remove).not.toHaveBeenCalled();
    expect(serverStorage.clear).not.toHaveBeenCalled();

    log('Data updated in both client and server storage');
  });

  it('should handle invalid data', () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const invalidData = { type: 'invalid', value: 'testValue' };
    const expirationDate = new Date();

    cache.set('testId', 'testStore', invalidData, expirationDate);

    expect(clientStorage.get).not.toHaveBeenCalled();
    expect(clientStorage.set).not.toHaveBeenCalled();
    expect(clientStorage.remove).not.toHaveBeenCalled();
    expect(clientStorage.clear).not.toHaveBeenCalled();

    expect(serverStorage.get).not.toHaveBeenCalled();
    expect(serverStorage.set).not.toHaveBeenCalled();
    expect(serverStorage.remove).not.toHaveBeenCalled();
    expect(serverStorage.clear).not.toHaveBeenCalled();

    log('Invalid data handled');
  });
});
