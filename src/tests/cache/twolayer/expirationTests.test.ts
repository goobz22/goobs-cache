import { TwoLayerCache } from '../../../cache/twoLayerServerlessAndSession';
import { CacheConfig, DataValue } from '../../../types';
import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';

describe('TwoLayer Cache - expiration', () => {
  let cache: TwoLayerCache;
  let config: CacheConfig;
  const logStream = createLogStream('expirationTests.log');
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

  it('should return undefined for an expired value', async () => {
    const key = 'expiredKey';
    const store = 'expiredStore';
    const value: DataValue = 'expiredValue';
    const expirationDate = new Date(Date.now() - 1000);

    await cache.set(key, store, value, expirationDate);

    const result = await cache.get(key, store);

    expect(result.value).toBeUndefined();
  });

  it('should remove an expired value from the cache', async () => {
    const key = 'expiredKey';
    const store = 'expiredStore';
    const value: DataValue = 'expiredValue';
    const expirationDate = new Date(Date.now() - 1000);

    await cache.set(key, store, value, expirationDate);

    const result1 = await cache.get(key, store);
    expect(result1.value).toBeUndefined();

    const result2 = await cache.get(key, store);
    expect(result2.value).toBeUndefined();
  });

  it('should not remove a non-expired value from the cache', async () => {
    const key = 'nonExpiredKey';
    const store = 'nonExpiredStore';
    const value: DataValue = 'nonExpiredValue';
    const expirationDate = new Date(Date.now() + config.cacheMaxAge);

    await cache.set(key, store, value, expirationDate);

    const result1 = await cache.get(key, store);
    expect(result1.value).toBe(value);

    const result2 = await cache.get(key, store);
    expect(result2.value).toBe(value);
  });

  it('should notify subscribers when a value expires', async () => {
    const key = 'expiredKey';
    const store = 'expiredStore';
    const value: DataValue = 'expiredValue';
    const expirationDate = new Date(Date.now() + 1000);

    const listener = jest.fn();

    cache.subscribeToUpdates(key, store, listener);

    await cache.set(key, store, value, expirationDate);

    await new Promise((resolve) => setTimeout(resolve, 1100));

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, value);
    expect(listener).toHaveBeenNthCalledWith(2, undefined);
  });
});
