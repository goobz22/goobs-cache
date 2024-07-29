import { TwoLayerCache } from '../../../cache/twoLayerServerlessAndSession';
import { CacheConfig, DataValue } from '../../../types';
import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';

describe('TwoLayer Cache - Edge Cases', () => {
  let cache: TwoLayerCache;
  let config: CacheConfig;
  const logStream = createLogStream('edgeCaseTests.log');
  const log = createLogger(logStream);

  beforeAll(() => {
    config = { ...mockCacheConfig };
    setMockedGlobals();
    setupErrorHandling(log, logStream);
  });

  beforeEach(() => {
    cache = new TwoLayerCache(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle setting and getting empty string values', async () => {
    log('Testing empty string values');
    const key = 'emptyStringKey';
    const store = 'emptyStringStore';
    const value: DataValue = '';

    await cache.set(key, store, value, new Date(Date.now() + 1000));
    const result = await cache.get(key, store);

    expect(result.value).toBe('');
  });

  it('should handle setting and getting null values', async () => {
    log('Testing null values');
    const key = 'nullKey';
    const store = 'nullStore';
    const value: DataValue = null;

    await cache.set(key, store, value, new Date(Date.now() + 1000));
    const result = await cache.get(key, store);

    expect(result.value).toBeNull();
  });

  it('should handle setting and getting undefined values', async () => {
    log('Testing undefined values');
    const key = 'undefinedKey';
    const store = 'undefinedStore';
    const value: DataValue = undefined;

    await cache.set(key, store, value, new Date(Date.now() + 1000));
    const result = await cache.get(key, store);

    expect(result.value).toBeUndefined();
  });

  it('should handle very long keys and store names', async () => {
    log('Testing very long keys and store names');
    const key = 'a'.repeat(1000);
    const store = 'b'.repeat(1000);
    const value: DataValue = 'longKeyAndStoreTest';

    await cache.set(key, store, value, new Date(Date.now() + 1000));
    const result = await cache.get(key, store);

    expect(result.value).toBe(value);
  });

  it('should handle setting a value with immediate expiration', async () => {
    log('Testing immediate expiration');
    const key = 'immediateExpirationKey';
    const store = 'immediateExpirationStore';
    const value: DataValue = 'shouldExpireImmediately';

    await cache.set(key, store, value, new Date(Date.now()));
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay to ensure expiration
    const result = await cache.get(key, store);

    expect(result.value).toBeUndefined();
  });

  it('should handle concurrent set operations on the same key', async () => {
    log('Testing concurrent set operations');
    const key = 'concurrentKey';
    const store = 'concurrentStore';
    const value1: DataValue = 'value1';
    const value2: DataValue = 'value2';

    await Promise.all([
      cache.set(key, store, value1, new Date(Date.now() + 1000)),
      cache.set(key, store, value2, new Date(Date.now() + 1000)),
    ]);

    const result = await cache.get(key, store);
    expect([value1, value2]).toContain(result.value);
  });

  it('should handle removing a non-existent key', async () => {
    log('Testing removal of non-existent key');
    const key = 'nonExistentKey';
    const store = 'nonExistentStore';

    await expect(cache.remove(key, store)).resolves.not.toThrow();
  });

  it('should handle subscribing to updates for a non-existent key', async () => {
    log('Testing subscription to non-existent key');
    const key = 'nonExistentKey';
    const store = 'nonExistentStore';
    const listener = jest.fn();

    const unsubscribe = cache.subscribeToUpdates(key, store, listener);
    await cache.set(key, store, 'newValue', new Date(Date.now() + 1000));

    expect(listener).toHaveBeenCalledWith('newValue');
    unsubscribe();
  });

  it('should handle clearing an empty cache', async () => {
    log('Testing clearing of empty cache');
    await expect(cache.clear()).resolves.not.toThrow();
  });
});
