import { TwoLayerCache } from '../../../cache/twoLayerServerlessAndSession';
import { CacheConfig, DataValue } from '../../../types';
import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';

describe('TwoLayer Cache - performance', () => {
  let cache: TwoLayerCache;
  let config: CacheConfig;
  const logStream = createLogStream('performanceTests.log');
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

  it('should handle a large number of set operations efficiently', async () => {
    const numItems = 1000;
    const data: { [key: string]: { [store: string]: DataValue } } = {};

    for (let i = 0; i < numItems; i++) {
      data[`key${i}`] = {
        store: `value${i}`,
      };
    }

    const startTime = Date.now();

    await cache.preloadCache(data);

    const endTime = Date.now();
    const duration = endTime - startTime;

    log(`Set ${numItems} items in ${duration}ms`);

    expect(duration).toBeLessThan(1000);
  });

  it('should handle a large number of get operations efficiently', async () => {
    const numItems = 1000;
    const data: { [key: string]: { [store: string]: DataValue } } = {};

    for (let i = 0; i < numItems; i++) {
      data[`key${i}`] = {
        store: `value${i}`,
      };
    }

    await cache.preloadCache(data);

    const startTime = Date.now();

    const promises: Promise<DataValue | undefined>[] = [];

    for (let i = 0; i < numItems; i++) {
      promises.push(cache.get(`key${i}`, 'store').then((result) => result.value));
    }

    await Promise.all(promises);

    const endTime = Date.now();
    const duration = endTime - startTime;

    log(`Get ${numItems} items in ${duration}ms`);

    expect(duration).toBeLessThan(1000);
  });

  it('should handle a large number of remove operations efficiently', async () => {
    const numItems = 1000;
    const data: { [key: string]: { [store: string]: DataValue } } = {};

    for (let i = 0; i < numItems; i++) {
      data[`key${i}`] = {
        store: `value${i}`,
      };
    }

    await cache.preloadCache(data);

    const startTime = Date.now();

    const promises: Promise<void>[] = [];

    for (let i = 0; i < numItems; i++) {
      promises.push(cache.remove(`key${i}`, 'store'));
    }

    await Promise.all(promises);

    const endTime = Date.now();
    const duration = endTime - startTime;

    log(`Remove ${numItems} items in ${duration}ms`);

    expect(duration).toBeLessThan(1000);
  });
});
