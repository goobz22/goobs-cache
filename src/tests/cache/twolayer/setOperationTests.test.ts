import { TwoLayerCache } from '../../../cache/twoLayerServerlessAndSession';
import { CacheConfig, DataValue } from '../../../types';
import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';

describe('TwoLayer Cache - set operation', () => {
  let cache: TwoLayerCache;
  let config: CacheConfig;
  const logStream = createLogStream('setOperationTests.log');
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

  it('should set a value in the cache', async () => {
    const key = 'setKey';
    const store = 'setStore';
    const value: DataValue = 'setValue';

    await cache.set(key, store, value, new Date(Date.now() + config.cacheMaxAge));

    const result = await cache.get(key, store);

    expect(result.value).toBe(value);
  });

  it('should update an existing value in the cache', async () => {
    const key = 'setKey';
    const store = 'setStore';
    const value1: DataValue = 'setValue1';
    const value2: DataValue = 'setValue2';

    await cache.set(key, store, value1, new Date(Date.now() + config.cacheMaxAge));
    await cache.set(key, store, value2, new Date(Date.now() + config.cacheMaxAge));

    const result = await cache.get(key, store);

    expect(result.value).toBe(value2);
  });

  it('should set a value with an expiration date', async () => {
    const key = 'setKey';
    const store = 'setStore';
    const value: DataValue = 'setValue';
    const expirationDate = new Date(Date.now() + 1000);

    await cache.set(key, store, value, expirationDate);

    const result1 = await cache.get(key, store);
    expect(result1.value).toBe(value);

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const result2 = await cache.get(key, store);
    expect(result2.value).toBeUndefined();
  });

  it('should notify subscribers when a value is set', async () => {
    const key = 'setKey';
    const store = 'setStore';
    const value: DataValue = 'setValue';

    const listener = jest.fn();

    cache.subscribeToUpdates(key, store, listener);

    await cache.set(key, store, value, new Date(Date.now() + config.cacheMaxAge));

    expect(listener).toHaveBeenCalledWith(value);
  });
});
