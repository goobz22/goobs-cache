import { TwoLayerCache } from '../../../cache/twoLayerServerlessAndSession';
import { CacheConfig, DataValue } from '../../../types';
import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';

describe('TwoLayer Cache - error handling', () => {
  let cache: TwoLayerCache;
  let config: CacheConfig;
  const logStream = createLogStream('errorHandlingTests.log');
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

  it('should handle errors in set operation gracefully', async () => {
    const key = 'errorKey';
    const store = 'errorStore';
    const value: DataValue = 'errorValue';
    const expirationDate = new Date(Date.now() + config.cacheMaxAge);

    const errorMessage = 'Simulated set error';
    jest.spyOn(cache['serverCache'], 'set').mockRejectedValueOnce(new Error(errorMessage));

    await expect(cache.set(key, store, value, expirationDate)).rejects.toThrow(errorMessage);
  });

  it('should handle errors in get operation gracefully', async () => {
    const key = 'errorKey';
    const store = 'errorStore';

    const errorMessage = 'Simulated get error';
    jest.spyOn(cache['serverCache'], 'get').mockRejectedValueOnce(new Error(errorMessage));

    await expect(cache.get(key, store)).rejects.toThrow(errorMessage);
  });

  it('should handle errors in remove operation gracefully', async () => {
    const key = 'errorKey';
    const store = 'errorStore';

    const errorMessage = 'Simulated remove error';
    jest.spyOn(cache['serverCache'], 'remove').mockRejectedValueOnce(new Error(errorMessage));

    await expect(cache.remove(key, store)).rejects.toThrow(errorMessage);
  });

  it('should handle errors in clear operation gracefully', async () => {
    const errorMessage = 'Simulated clear error';
    jest.spyOn(cache['serverCache'], 'clear').mockRejectedValueOnce(new Error(errorMessage));

    await expect(cache.clear()).rejects.toThrow(errorMessage);
  });

  it('should handle errors in subscribeToUpdates operation gracefully', async () => {
    const key = 'errorKey';
    const store = 'errorStore';
    const listener = jest.fn();

    const errorMessage = 'Simulated subscribeToUpdates error';
    jest.spyOn(cache['serverCache'], 'subscribeToUpdates').mockImplementationOnce(() => {
      throw new Error(errorMessage);
    });

    expect(() => cache.subscribeToUpdates(key, store, listener)).toThrow(errorMessage);
  });
});
