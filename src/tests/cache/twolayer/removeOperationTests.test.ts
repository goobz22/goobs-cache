import { TwoLayerCache } from '../../../cache/twoLayerServerlessAndSession';
import { CacheConfig, DataValue } from '../../../types';
import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';

describe('TwoLayer Cache - remove operation', () => {
  let cache: TwoLayerCache;
  let config: CacheConfig;
  const logStream = createLogStream('removeOperationTests.log');
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

  it('should remove a value from the cache', async () => {
    const key = 'removeKey';
    const store = 'removeStore';
    const value: DataValue = 'removeValue';

    await cache.set(key, store, value, new Date(Date.now() + config.cacheMaxAge));

    const result1 = await cache.get(key, store);
    expect(result1.value).toBe(value);

    await cache.remove(key, store);

    const result2 = await cache.get(key, store);
    expect(result2.value).toBeUndefined();
  });

  it('should not throw an error when removing a non-existent value', async () => {
    const key = 'removeKey';
    const store = 'removeStore';

    await expect(cache.remove(key, store)).resolves.not.toThrow();
  });

  it('should notify subscribers when a value is removed', async () => {
    const key = 'removeKey';
    const store = 'removeStore';
    const value: DataValue = 'removeValue';

    const listener = jest.fn();

    cache.subscribeToUpdates(key, store, listener);

    await cache.set(key, store, value, new Date(Date.now() + config.cacheMaxAge));
    await cache.remove(key, store);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, value);
    expect(listener).toHaveBeenNthCalledWith(2, undefined);
  });
});
