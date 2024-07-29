import fs from 'fs';
import { TwoLayerServerCache, ServerStorage } from '../../../../utils/twoLayerCache.server';
import { CacheConfig, StringValue, ListValue, HashValue, JSONValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerServerCache - Data Value Handling', () => {
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

    logStream = createLogStream('server-cache-data-value-handling-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should handle string values', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date();

    await cache.set('testId', 'testStore', testData, expirationDate);

    expect(serverStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);

    const result = await cache.get('testId', 'testStore');
    expect(result).toEqual(expect.objectContaining({ value: testData }));

    log('String values handled');
  });

  it('should handle list values', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: ListValue = { type: 'list', value: ['item1', 'item2', 'item3'] };
    const expirationDate = new Date();

    await cache.set('testId', 'testStore', testData, expirationDate);

    expect(serverStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);

    const result = await cache.get('testId', 'testStore');
    expect(result).toEqual(expect.objectContaining({ value: testData }));

    log('List values handled');
  });

  it('should handle hash values', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: HashValue = { type: 'hash', value: { key1: 'value1', key2: 'value2' } };
    const expirationDate = new Date();

    await cache.set('testId', 'testStore', testData, expirationDate);

    expect(serverStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);

    const result = await cache.get('testId', 'testStore');
    expect(result).toEqual(expect.objectContaining({ value: testData }));

    log('Hash values handled');
  });

  it('should handle JSON values', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: JSONValue = {
      type: 'json',
      value: {
        key1: 'value1',
        key2: [1, 2, 3],
        key3: { nestedKey: 'nestedValue' },
      },
    };
    const expirationDate = new Date();

    await cache.set('testId', 'testStore', testData, expirationDate);

    expect(serverStorage.set).toHaveBeenCalledWith('testId', 'testStore', testData, expirationDate);

    const result = await cache.get('testId', 'testStore');
    expect(result).toEqual(expect.objectContaining({ value: testData }));

    log('JSON values handled');
  });
});
