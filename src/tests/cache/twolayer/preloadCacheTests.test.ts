import { TwoLayerCache } from '../../../cache/twoLayerServerlessAndSession';
import { CacheConfig, DataValue } from '../../../types';
import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';

describe('TwoLayer Cache - preloadCache', () => {
  let cache: TwoLayerCache;
  let config: CacheConfig;
  const logStream = createLogStream('preloadCacheTests.log');
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

  it('should preload the cache with the provided data', async () => {
    const data: { [key: string]: { [store: string]: DataValue } } = {
      key1: {
        store1: 'value1',
        store2: 'value2',
      },
      key2: {
        store1: 'value3',
        store2: 'value4',
      },
    };

    await cache.preloadCache(data);

    const result1 = await cache.get('key1', 'store1');
    expect(result1.value).toBe('value1');

    const result2 = await cache.get('key1', 'store2');
    expect(result2.value).toBe('value2');

    const result3 = await cache.get('key2', 'store1');
    expect(result3.value).toBe('value3');

    const result4 = await cache.get('key2', 'store2');
    expect(result4.value).toBe('value4');
  });

  it('should set the expiration date based on the cacheMaxAge config', async () => {
    const data: { [key: string]: { [store: string]: DataValue } } = {
      key1: {
        store1: 'value1',
      },
    };

    await cache.preloadCache(data);

    const result = await cache.get('key1', 'store1');
    expect(result.expirationDate.getTime()).toBeGreaterThan(Date.now() + config.cacheMaxAge - 1000);
    expect(result.expirationDate.getTime()).toBeLessThanOrEqual(Date.now() + config.cacheMaxAge);
  });

  it('should notify subscribers when preloading the cache', async () => {
    const data: { [key: string]: { [store: string]: DataValue } } = {
      key1: {
        store1: 'value1',
      },
    };

    const listener = jest.fn();

    cache.subscribeToUpdates('key1', 'store1', listener);

    await cache.preloadCache(data);

    expect(listener).toHaveBeenCalledWith('value1');
  });
});
