import { TwoLayerCache } from '../../../cache/twoLayerServerlessAndSession';
import { CacheConfig, DataValue } from '../../../types';
import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';

describe('TwoLayer Cache - subscribeToUpdates', () => {
  let cache: TwoLayerCache;
  let config: CacheConfig;
  const logStream = createLogStream('subscribeToUpdatesTests.log');
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

  it('should notify subscribers when a value is set', async () => {
    const key = 'subscriberKey';
    const store = 'subscriberStore';
    const value: DataValue = 'subscriberValue';

    const listener = jest.fn();

    cache.subscribeToUpdates(key, store, listener);

    await cache.set(key, store, value, new Date(Date.now() + config.cacheMaxAge));

    expect(listener).toHaveBeenCalledWith(value);
  });

  it('should notify subscribers when a value is updated', async () => {
    const key = 'subscriberKey';
    const store = 'subscriberStore';
    const value1: DataValue = 'subscriberValue1';
    const value2: DataValue = 'subscriberValue2';

    const listener = jest.fn();

    cache.subscribeToUpdates(key, store, listener);

    await cache.set(key, store, value1, new Date(Date.now() + config.cacheMaxAge));
    await cache.set(key, store, value2, new Date(Date.now() + config.cacheMaxAge));

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, value1);
    expect(listener).toHaveBeenNthCalledWith(2, value2);
  });

  it('should notify subscribers when a value is removed', async () => {
    const key = 'subscriberKey';
    const store = 'subscriberStore';
    const value: DataValue = 'subscriberValue';

    const listener = jest.fn();

    cache.subscribeToUpdates(key, store, listener);

    await cache.set(key, store, value, new Date(Date.now() + config.cacheMaxAge));
    await cache.remove(key, store);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, value);
    expect(listener).toHaveBeenNthCalledWith(2, undefined);
  });

  it('should unsubscribe listeners correctly', async () => {
    const key = 'subscriberKey';
    const store = 'subscriberStore';
    const value: DataValue = 'subscriberValue';

    const listener = jest.fn();

    const unsubscribe = cache.subscribeToUpdates(key, store, listener);

    await cache.set(key, store, value, new Date(Date.now() + config.cacheMaxAge));

    expect(listener).toHaveBeenCalledWith(value);

    unsubscribe();

    await cache.set(key, store, 'newValue', new Date(Date.now() + config.cacheMaxAge));

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
