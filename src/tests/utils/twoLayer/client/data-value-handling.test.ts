import fs from 'fs';
import {
  TwoLayerClientCache,
  ClientStorage,
  ServerStorage,
} from '../../../../utils/twoLayerCache.client';
import { CacheConfig, StringValue, ListValue, HashValue, JSONValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerClientCache - Data Value Handling', () => {
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

    logStream = createLogStream('data-value-handling-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should handle string values', () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    cache.set('testId', 'testStore', testData, expirationDate);

    expect(clientStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    expect(serverStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);

    log('String values handled');
  });

  it('should handle list values', () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData: ListValue = { type: 'list', value: ['item1', 'item2', 'item3'] };
    const expirationDate = new Date();

    cache.set('testId', 'testStore', testData, expirationDate);

    expect(clientStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    expect(serverStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);

    log('List values handled');
  });

  it('should handle hash values', () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData: HashValue = { type: 'hash', value: { key1: 'value1', key2: 'value2' } };
    const expirationDate = new Date();

    cache.set('testId', 'testStore', testData, expirationDate);

    expect(clientStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    expect(serverStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);

    log('Hash values handled');
  });

  it('should handle JSON values', () => {
    const cache = new TwoLayerClientCache(defaultConfig, clientStorage, serverStorage);
    const testData: JSONValue = {
      type: 'json',
      value: {
        key1: 'value1',
        key2: [1, 2, 3],
        key3: { nestedKey: 'nestedValue' },
      },
    };
    const expirationDate = new Date();

    cache.set('testId', 'testStore', testData, expirationDate);

    expect(clientStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);
    expect(serverStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);

    log('JSON values handled');
  });
});
