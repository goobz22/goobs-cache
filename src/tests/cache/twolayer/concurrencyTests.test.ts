import { TwoLayerCache } from '../../../cache/twoLayerServerlessAndSession';
import { CacheConfig, DataValue } from '../../../types';
import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';

describe('TwoLayer Cache - concurrency', () => {
  let cache: TwoLayerCache;
  let config: CacheConfig;
  const logStream = createLogStream('concurrencyTests.log');
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

  it('should handle concurrent get operations correctly', async () => {
    const key = 'concurrentKey';
    const store = 'concurrentStore';
    const value: DataValue = 'concurrentValue';

    await cache.set(key, store, value, new Date(Date.now() + config.cacheMaxAge));

    const promises: Promise<DataValue | undefined>[] = [];

    for (let i = 0; i < 10; i++) {
      promises.push(cache.get(key, store).then((result) => result.value));
    }

    const results = await Promise.all(promises);

    results.forEach((result) => {
      expect(result).toBe(value);
    });
  });

  it('should handle concurrent set operations correctly', async () => {
    const key = 'concurrentKey';
    const store = 'concurrentStore';
    const value1: DataValue = 'concurrentValue1';
    const value2: DataValue = 'concurrentValue2';

    const promises: Promise<void>[] = [];

    for (let i = 0; i < 5; i++) {
      promises.push(cache.set(key, store, value1, new Date(Date.now() + config.cacheMaxAge)));
      promises.push(cache.set(key, store, value2, new Date(Date.now() + config.cacheMaxAge)));
    }

    await Promise.all(promises);

    const result = await cache.get(key, store);

    expect([value1, value2]).toContain(result.value);
  });

  it('should handle concurrent remove operations correctly', async () => {
    const key = 'concurrentKey';
    const store = 'concurrentStore';
    const value: DataValue = 'concurrentValue';

    await cache.set(key, store, value, new Date(Date.now() + config.cacheMaxAge));

    const promises: Promise<void>[] = [];

    for (let i = 0; i < 10; i++) {
      promises.push(cache.remove(key, store));
    }

    await Promise.all(promises);

    const result = await cache.get(key, store);

    expect(result.value).toBeUndefined();
  });
});
