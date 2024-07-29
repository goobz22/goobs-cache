import fs from 'fs';
import { TwoLayerServerCache, ServerStorage } from '../../../../utils/twoLayerCache.server';
import { CacheConfig, StringValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerServerCache - Invalid Input Handling', () => {
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

    logStream = createLogStream('server-cache-invalid-input-handling-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should throw an error when setting a value with an empty identifier', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    await expect(cache.set('', 'testStore', testData, expirationDate)).rejects.toThrow(
      'Invalid identifier',
    );
    log('Empty identifier handling test passed');
  });

  it('should throw an error when setting a value with an empty store name', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const expirationDate = new Date(Date.now() + 1000);

    await expect(cache.set('testId', '', testData, expirationDate)).rejects.toThrow(
      'Invalid store name',
    );
    log('Empty store name handling test passed');
  });

  it('should throw an error when setting a value with an invalid expiration date', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const invalidDate = new Date('invalid date');

    await expect(cache.set('testId', 'testStore', testData, invalidDate)).rejects.toThrow(
      'Invalid expiration date',
    );
    log('Invalid expiration date handling test passed');
  });

  it('should throw an error when getting a value with an empty identifier', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);

    await expect(cache.get('', 'testStore')).rejects.toThrow('Invalid identifier');
    log('Empty identifier in get operation handling test passed');
  });

  it('should throw an error when getting a value with an empty store name', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);

    await expect(cache.get('testId', '')).rejects.toThrow('Invalid store name');
    log('Empty store name in get operation handling test passed');
  });

  it('should throw an error when removing a value with an empty identifier', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);

    await expect(cache.remove('', 'testStore')).rejects.toThrow('Invalid identifier');
    log('Empty identifier in remove operation handling test passed');
  });

  it('should throw an error when removing a value with an empty store name', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);

    await expect(cache.remove('testId', '')).rejects.toThrow('Invalid store name');
    log('Empty store name in remove operation handling test passed');
  });

  it('should throw an error when subscribing with an empty identifier', () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);

    expect(() => cache.subscribeToUpdates('', 'testStore', jest.fn())).toThrow(
      'Invalid identifier',
    );
    log('Empty identifier in subscribe operation handling test passed');
  });

  it('should throw an error when subscribing with an empty store name', () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);

    expect(() => cache.subscribeToUpdates('testId', '', jest.fn())).toThrow('Invalid store name');
    log('Empty store name in subscribe operation handling test passed');
  });
});
