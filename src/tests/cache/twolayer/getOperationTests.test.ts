import { TwoLayerCache } from '../../../cache/twoLayerServerlessAndSession';
import { CacheConfig, DataValue } from '../../../types';
import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';

describe('TwoLayer Cache - get operation', () => {
  let cache: TwoLayerCache;
  let config: CacheConfig;
  const logStream = createLogStream('getOperationTests.log');
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

  it('should retrieve a value from the cache', async () => {
    const key = 'testKey';
    const store = 'testStore';
    const value: DataValue = 'testValue';

    await cache.set(key, store, value, new Date(Date.now() + config.cacheMaxAge));

    const result = await cache.get(key, store);

    expect(result.value).toBe(value);
  });

  it('should return undefined for a non-existent key', async () => {
    const key = 'nonExistentKey';
    const store = 'testStore';

    const result = await cache.get(key, store);

    expect(result.value).toBeUndefined();
  });

  it('should return undefined for an expired value', async () => {
    const key = 'expiredKey';
    const store = 'testStore';
    const value: DataValue = 'expiredValue';

    await cache.set(key, store, value, new Date(Date.now() - 1000)); // Set expiration to the past

    const result = await cache.get(key, store);

    expect(result.value).toBeUndefined();
  });

  it('should retrieve a value from server cache if not found in client cache', async () => {
    const key = 'serverKey';
    const store = 'testStore';
    const value: DataValue = 'serverValue';

    // Mock server cache to return a value
    jest.spyOn(cache['serverCache'], 'get').mockResolvedValueOnce({
      identifier: key,
      storeName: store,
      value: value,
      expirationDate: new Date(Date.now() + config.cacheMaxAge),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    const result = await cache.get(key, store);

    expect(result.value).toBe(value);
  });

  it('should update client cache after retrieving from server cache', async () => {
    const key = 'updateKey';
    const store = 'testStore';
    const value: DataValue = 'updateValue';

    // Mock server cache to return a value
    jest.spyOn(cache['serverCache'], 'get').mockResolvedValueOnce({
      identifier: key,
      storeName: store,
      value: value,
      expirationDate: new Date(Date.now() + config.cacheMaxAge),
      lastUpdatedDate: new Date(),
      lastAccessedDate: new Date(),
      getHitCount: 1,
      setHitCount: 1,
    });

    await cache.get(key, store);

    // Verify that the value is now in the client cache
    const clientResult = await cache.get(key, store);
    expect(clientResult.value).toBe(value);
  });

  it('should handle errors during get operation', async () => {
    const key = 'errorKey';
    const store = 'testStore';

    // Mock an error in the server cache get operation
    jest.spyOn(cache['serverCache'], 'get').mockRejectedValueOnce(new Error('Server error'));

    await expect(cache.get(key, store)).rejects.toThrow('Server error');
  });

  it('should notify subscribers after a successful get operation', async () => {
    const key = 'subscriberKey';
    const store = 'testStore';
    const value: DataValue = 'subscriberValue';

    const listener = jest.fn();
    cache.subscribeToUpdates(key, store, listener);

    await cache.set(key, store, value, new Date(Date.now() + config.cacheMaxAge));
    await cache.get(key, store);

    expect(listener).toHaveBeenCalledWith(value);
  });
});
