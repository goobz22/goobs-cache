import fs from 'fs';
import {
  TwoLayerClientCache,
  ClientStorage,
  ServerStorage,
} from '../../../../utils/twoLayerCache.client';
import { CacheConfig, StringValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerClientCache - Invalid Input Handling', () => {
  let clientStorage: ClientStorage;
  let serverStorage: ServerStorage;
  let defaultConfig: CacheConfig;
  let logStream: fs.WriteStream;
  let log: (message: string) => void;
  let cache: TwoLayerClientCache;

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

    logStream = createLogStream('invalid-input-handling-test.log');
    log = createLogger(logStream);

    cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should handle empty identifier in get operation', async () => {
    const getAsync = (): Promise<void> => {
      return new Promise((resolve) => {
        cache.get('', 'testStore', () => {
          resolve();
        });
      });
    };

    await getAsync();

    expect(clientStorage.get).not.toHaveBeenCalled();
    expect(serverStorage.get).not.toHaveBeenCalled();
    log('Empty identifier handled in get operation');
  });

  it('should handle empty store name in set operation', async () => {
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    await cache.set('testId', '', testData, expirationDate);

    expect(clientStorage.set).not.toHaveBeenCalled();
    expect(serverStorage.set).not.toHaveBeenCalled();
    log('Empty store name handled in set operation');
  });

  it('should handle invalid data type in set operation', async () => {
    const invalidData = { type: 'invalid', value: 'testValue' };
    const expirationDate = new Date();

    await cache.set('testId', 'testStore', invalidData as StringValue, expirationDate);

    expect(clientStorage.set).not.toHaveBeenCalled();
    expect(serverStorage.set).not.toHaveBeenCalled();
    log('Invalid data type handled in set operation');
  });

  it('should handle invalid expiration date in set operation', async () => {
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const invalidDate = 'invalid date' as unknown as Date;

    await cache.set('testId', 'testStore', testData, invalidDate);

    expect(clientStorage.set).not.toHaveBeenCalled();
    expect(serverStorage.set).not.toHaveBeenCalled();
    log('Invalid expiration date handled in set operation');
  });

  it('should handle empty identifier in remove operation', async () => {
    await cache.remove('', 'testStore');

    expect(clientStorage.remove).not.toHaveBeenCalled();
    expect(serverStorage.remove).not.toHaveBeenCalled();
    log('Empty identifier handled in remove operation');
  });

  it('should handle invalid config in constructor', () => {
    const invalidConfig = { ...defaultConfig, cacheSize: -1 };
    expect(() => new TwoLayerClientCache(invalidConfig, clientStorage, serverStorage)).toThrow();
    log('Invalid config handled in constructor');
  });
});
