import fs from 'fs';
import { TwoLayerServerCache, ServerStorage } from '../../../../utils/twoLayerCache.server';
import { CacheConfig, StringValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerServerCache - Error Handling', () => {
  let serverStorage: ServerStorage;
  let defaultConfig: CacheConfig;
  let logStream: fs.WriteStream;
  let log: (message: string) => void;

  beforeEach(() => {
    serverStorage = {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      subscribeToUpdates: jest.fn(),
    };

    defaultConfig = mockCacheConfig;

    logStream = createLogStream('server-cache-error-handling-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should handle get operation errors', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const errorMessage = 'Get operation failed';
    serverStorage.get = jest.fn().mockRejectedValue(new Error(errorMessage));

    await expect(cache.get('testId', 'testStore')).rejects.toThrow(errorMessage);
    log('Get operation error handled');
  });

  it('should handle set operation errors', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const errorMessage = 'Set operation failed';
    serverStorage.set = jest.fn().mockRejectedValue(new Error(errorMessage));

    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    await expect(cache.set('testId', 'testStore', testData, expirationDate)).rejects.toThrow(
      errorMessage,
    );
    log('Set operation error handled');
  });

  it('should handle remove operation errors', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const errorMessage = 'Remove operation failed';
    serverStorage.remove = jest.fn().mockRejectedValue(new Error(errorMessage));

    await expect(cache.remove('testId', 'testStore')).rejects.toThrow(errorMessage);
    log('Remove operation error handled');
  });

  it('should handle clear operation errors', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const errorMessage = 'Clear operation failed';
    serverStorage.clear = jest.fn().mockRejectedValue(new Error(errorMessage));

    await expect(cache.clear()).rejects.toThrow(errorMessage);
    log('Clear operation error handled');
  });

  it('should handle subscription errors', () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const errorMessage = 'Subscription failed';
    serverStorage.subscribeToUpdates = jest.fn().mockImplementation(() => {
      throw new Error(errorMessage);
    });

    expect(() => cache.subscribeToUpdates('testId', 'testStore', jest.fn())).toThrow(errorMessage);
    log('Subscription error handled');
  });

  it('should handle errors during initialization', () => {
    const invalidConfig: CacheConfig = {
      ...defaultConfig,
      cacheSize: -1, // Invalid cache size
    };

    expect(() => new TwoLayerServerCache(invalidConfig, serverStorage)).toThrow(
      'Invalid cache configuration',
    );
    log('Initialization error handled');
  });

  it('should handle network errors', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const networkError = new Error('Network error');
    serverStorage.get = jest.fn().mockRejectedValue(networkError);

    await expect(cache.get('testId', 'testStore')).rejects.toThrow('Network error');
    log('Network error handled');
  });

  it('should handle timeout errors', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const timeoutError = new Error('Operation timed out');
    serverStorage.set = jest.fn().mockRejectedValue(timeoutError);

    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    await expect(cache.set('testId', 'testStore', testData, expirationDate)).rejects.toThrow(
      'Operation timed out',
    );
    log('Timeout error handled');
  });

  it('should handle concurrent operation errors', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    let operationCount = 0;
    serverStorage.set = jest.fn().mockImplementation(() => {
      operationCount++;
      if (operationCount > 1) {
        throw new Error('Concurrent operation error');
      }
      return Promise.resolve();
    });

    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    const operation1 = cache.set('testId1', 'testStore', testData, expirationDate);
    const operation2 = cache.set('testId2', 'testStore', testData, expirationDate);

    await expect(Promise.all([operation1, operation2])).rejects.toThrow(
      'Concurrent operation error',
    );
    log('Concurrent operation error handled');
  });
});
