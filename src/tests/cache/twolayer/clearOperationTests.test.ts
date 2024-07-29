import { TwoLayerCache } from '../../../cache/twoLayerServerlessAndSession';
import { CacheConfig, DataValue } from '../../../types';
import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';

describe('TwoLayer Cache - clear operation', () => {
  let cache: TwoLayerCache;
  let config: CacheConfig;
  const logStream = createLogStream('clearOperationTests.log');
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

  it('should clear all data from the cache', async () => {
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

    await cache.clear();

    const result1 = await cache.get('key1', 'store1');
    expect(result1.value).toBeUndefined();

    const result2 = await cache.get('key2', 'store2');
    expect(result2.value).toBeUndefined();
  });

  it('should notify listeners when cache is cleared', async () => {
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

    const listener1 = jest.fn();
    const listener2 = jest.fn();

    cache.subscribeToUpdates('key1', 'store1', listener1);
    cache.subscribeToUpdates('key2', 'store2', listener2);

    await cache.clear();

    expect(listener1).toHaveBeenCalledWith(undefined);
    expect(listener2).toHaveBeenCalledWith(undefined);
  });
});
