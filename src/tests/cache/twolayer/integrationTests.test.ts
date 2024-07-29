import { TwoLayerCache } from '../../../cache/twoLayerServerlessAndSession';
import { CacheConfig, DataValue } from '../../../types';
import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';

describe('TwoLayer Cache - integration', () => {
  let cache: TwoLayerCache;
  let config: CacheConfig;
  const logStream = createLogStream('integrationTests.log');
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

  it('should handle a series of set, get, and remove operations', async () => {
    const key1 = 'integrationKey1';
    const key2 = 'integrationKey2';
    const store = 'integrationStore';
    const value1: DataValue = 'integrationValue1';
    const value2: DataValue = 'integrationValue2';

    await cache.set(key1, store, value1, new Date(Date.now() + config.cacheMaxAge));
    await cache.set(key2, store, value2, new Date(Date.now() + config.cacheMaxAge));

    const result1 = await cache.get(key1, store);
    expect(result1.value).toBe(value1);

    const result2 = await cache.get(key2, store);
    expect(result2.value).toBe(value2);

    await cache.remove(key1, store);

    const result3 = await cache.get(key1, store);
    expect(result3.value).toBeUndefined();

    const result4 = await cache.get(key2, store);
    expect(result4.value).toBe(value2);
  });

  it('should handle concurrent operations from multiple clients', async () => {
    const key = 'concurrentKey';
    const store = 'concurrentStore';
    const value1: DataValue = 'concurrentValue1';
    const value2: DataValue = 'concurrentValue2';

    const cache1 = new TwoLayerCache(config);
    const cache2 = new TwoLayerCache(config);

    await cache1.set(key, store, value1, new Date(Date.now() + config.cacheMaxAge));

    const result1 = await cache2.get(key, store);
    expect(result1.value).toBe(value1);

    await cache2.set(key, store, value2, new Date(Date.now() + config.cacheMaxAge));

    const result2 = await cache1.get(key, store);
    expect(result2.value).toBe(value2);

    await cache1.remove(key, store);

    const result3 = await cache2.get(key, store);
    expect(result3.value).toBeUndefined();
  });

  it('should handle preloading and updating cache data', async () => {
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

    const result2 = await cache.get('key2', 'store2');
    expect(result2.value).toBe('value4');

    await cache.set('key1', 'store1', 'updatedValue1', new Date(Date.now() + config.cacheMaxAge));

    const result3 = await cache.get('key1', 'store1');
    expect(result3.value).toBe('updatedValue1');

    await cache.remove('key2', 'store2');

    const result4 = await cache.get('key2', 'store2');
    expect(result4.value).toBeUndefined();
  });
});
