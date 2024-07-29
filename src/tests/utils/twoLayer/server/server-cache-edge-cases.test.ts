import fs from 'fs';
import { TwoLayerServerCache, ServerStorage } from '../../../../utils/twoLayerCache.server';
import { CacheConfig, StringValue, ListValue, HashValue } from '../../../../types';
import { mockCacheConfig, createLogStream, createLogger } from '../../../jest/default/logging';

describe('TwoLayerServerCache - Edge Cases', () => {
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

    logStream = createLogStream('server-cache-edge-cases-test.log');
    log = createLogger(logStream);
  });

  afterEach(() => {
    logStream.end();
  });

  it('should handle setting and getting empty string values', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: '' };
    const expirationDate = new Date();

    await cache.set('emptyString', 'testStore', testData, expirationDate);
    const result = await cache.get('emptyString', 'testStore');

    expect(result).toEqual(expect.objectContaining({ value: testData }));
    log('Empty string values handled');
  });

  it('should handle setting and getting empty list values', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: ListValue = { type: 'list', value: [] };
    const expirationDate = new Date();

    await cache.set('emptyList', 'testStore', testData, expirationDate);
    const result = await cache.get('emptyList', 'testStore');

    expect(result).toEqual(expect.objectContaining({ value: testData }));
    log('Empty list values handled');
  });

  it('should handle setting and getting empty hash values', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: HashValue = { type: 'hash', value: {} };
    const expirationDate = new Date();

    await cache.set('emptyHash', 'testStore', testData, expirationDate);
    const result = await cache.get('emptyHash', 'testStore');

    expect(result).toEqual(expect.objectContaining({ value: testData }));
    log('Empty hash values handled');
  });

  it('should handle getting non-existent keys', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    serverStorage.get = jest.fn().mockResolvedValue(undefined);

    const result = await cache.get('nonExistentKey', 'testStore');

    expect(result).toBeUndefined();
    log('Non-existent keys handled');
  });

  it('should handle removing non-existent keys', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    serverStorage.remove = jest.fn().mockResolvedValue(undefined);

    await expect(cache.remove('nonExistentKey', 'testStore')).resolves.not.toThrow();
    log('Removing non-existent keys handled');
  });

  it('should handle setting values with past expiration dates', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const testData: StringValue = { type: 'string', value: 'testValue' };
    const pastDate = new Date(Date.now() - 1000); // 1 second in the past

    await cache.set('pastExpiration', 'testStore', testData, pastDate);

    const result = await cache.get('pastExpiration', 'testStore');
    expect(result).toBeUndefined();
    log('Past expiration dates handled');
  });

  it('should handle subscription to non-existent keys', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const listener = jest.fn();

    const unsubscribe = cache.subscribeToUpdates('nonExistentKey', 'testStore', listener);
    expect(typeof unsubscribe).toBe('function');

    unsubscribe();
    log('Subscription to non-existent keys handled');
  });

  it('should handle clearing an empty cache', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    serverStorage.clear = jest.fn().mockResolvedValue(undefined);

    await expect(cache.clear()).resolves.not.toThrow();
    log('Clearing empty cache handled');
  });

  it('should handle setting maximum size string values', async () => {
    const cache = new TwoLayerServerCache(defaultConfig, serverStorage);
    const maxSizeString = 'a'.repeat(1024 * 1024); // 1MB string
    const testData: StringValue = { type: 'string', value: maxSizeString };
    const expirationDate = new Date();

    await cache.set('maxSizeString', 'testStore', testData, expirationDate);
    const result = await cache.get('maxSizeString', 'testStore');

    expect(result).toEqual(expect.objectContaining({ value: testData }));
    log('Maximum size string values handled');
  });
});
