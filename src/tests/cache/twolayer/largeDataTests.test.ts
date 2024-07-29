import { TwoLayerCache } from '../../../cache/twoLayerServerlessAndSession';
import { CacheConfig, DataValue } from '../../../types';
import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';

describe('TwoLayer Cache - large data', () => {
  let cache: TwoLayerCache;
  let config: CacheConfig;
  const logStream = createLogStream('largeDataTests.log');
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

  it('should handle setting and getting large data values', async () => {
    const key = 'largeDataKey';
    const store = 'largeDataStore';
    const largeValue: DataValue = 'x'.repeat(1024 * 1024); // 1MB string

    await cache.set(key, store, largeValue, new Date(Date.now() + config.cacheMaxAge));

    const result = await cache.get(key, store);

    expect(result.value).toBe(largeValue);
  });

  it('should handle preloading large data values', async () => {
    const numItems = 100;
    const data: { [key: string]: { [store: string]: DataValue } } = {};

    for (let i = 0; i < numItems; i++) {
      data[`key${i}`] = {
        store: 'x'.repeat(1024 * 1024), // 1MB string
      };
    }

    await cache.preloadCache(data);

    const promises: Promise<DataValue | undefined>[] = [];

    for (let i = 0; i < numItems; i++) {
      promises.push(cache.get(`key${i}`, 'store').then((result) => result.value));
    }

    const results = await Promise.all(promises);

    results.forEach((result, index) => {
      expect(result).toBe(data[`key${index}`].store);
    });
  });

  it('should handle removing large data values', async () => {
    const numItems = 100;
    const data: { [key: string]: { [store: string]: DataValue } } = {};

    for (let i = 0; i < numItems; i++) {
      data[`key${i}`] = {
        store: 'x'.repeat(1024 * 1024), // 1MB string
      };
    }

    await cache.preloadCache(data);

    const promises: Promise<void>[] = [];

    for (let i = 0; i < numItems; i++) {
      promises.push(cache.remove(`key${i}`, 'store'));
    }

    await Promise.all(promises);

    const getPromises: Promise<DataValue | undefined>[] = [];

    for (let i = 0; i < numItems; i++) {
      getPromises.push(cache.get(`key${i}`, 'store').then((result) => result.value));
    }

    const results = await Promise.all(getPromises);

    results.forEach((result) => {
      expect(result).toBeUndefined();
    });
  });
});
