import fs from 'fs';
import {
  TwoLayerClientCache,
  ClientStorage,
  ServerStorage,
} from '../../../../utils/twoLayerCache.client';
import { CacheConfig, StringValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerClientCache - Error Handling', () => {
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

    logStream = createLogStream('cache-error-handling-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should handle client storage get error', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testError = new Error('Client storage get error');

    clientStorage.get = jest.fn(
      (id: string, store: string, callback: (result: unknown) => void) => {
        callback(testError);
      },
    );

    const mockCallback = jest.fn();
    cache.get('testId', 'testStore', mockCallback);

    await new Promise(process.nextTick);

    expect(mockCallback).toHaveBeenCalledWith(undefined);
    expect(clientStorage.get).toHaveBeenCalledWith('testId', 'testStore', expect.any(Function));
    log('Client storage get error handled');
  });

  it('should handle server storage get error', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testError = new Error('Server storage get error');

    clientStorage.get = jest.fn(
      (id: string, store: string, callback: (result: unknown) => void) => {
        callback(undefined);
      },
    );
    serverStorage.get = jest.fn().mockRejectedValue(testError);

    const mockCallback = jest.fn();
    cache.get('testId', 'testStore', mockCallback);

    await new Promise(process.nextTick);

    expect(mockCallback).toHaveBeenCalledWith(undefined);
    expect(serverStorage.get).toHaveBeenCalledWith('testId', 'testStore');
    log('Server storage get error handled');
  });

  it('should handle client storage set error', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testError = new Error('Client storage set error');
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    clientStorage.set = jest.fn().mockRejectedValue(testError);

    await expect(cache.set('testId', 'testStore', testData, expirationDate)).rejects.toThrow(
      testError,
    );
    expect(clientStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    log('Client storage set error handled');
  });

  it('should handle server storage set error', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testError = new Error('Server storage set error');
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    serverStorage.set = jest.fn().mockRejectedValue(testError);

    await expect(cache.set('testId', 'testStore', testData, expirationDate)).rejects.toThrow(
      testError,
    );
    expect(serverStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    log('Server storage set error handled');
  });

  it('should handle client storage remove error', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testError = new Error('Client storage remove error');

    clientStorage.remove = jest.fn().mockRejectedValue(testError);

    await expect(cache.remove('testId', 'testStore')).rejects.toThrow(testError);
    expect(clientStorage.remove).toHaveBeenCalledWith('testId', 'testStore');
    log('Client storage remove error handled');
  });

  it('should handle server storage remove error', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testError = new Error('Server storage remove error');

    serverStorage.remove = jest.fn().mockRejectedValue(testError);

    await expect(cache.remove('testId', 'testStore')).rejects.toThrow(testError);
    expect(serverStorage.remove).toHaveBeenCalledWith('testId', 'testStore');
    log('Server storage remove error handled');
  });

  it('should handle client storage clear error', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testError = new Error('Client storage clear error');

    clientStorage.clear = jest.fn().mockRejectedValue(testError);

    await expect(cache.clear()).rejects.toThrow(testError);
    expect(clientStorage.clear).toHaveBeenCalled();
    log('Client storage clear error handled');
  });

  it('should handle server storage clear error', async () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testError = new Error('Server storage clear error');

    serverStorage.clear = jest.fn().mockRejectedValue(testError);

    await expect(cache.clear()).rejects.toThrow(testError);
    expect(serverStorage.clear).toHaveBeenCalled();
    log('Server storage clear error handled');
  });
});
