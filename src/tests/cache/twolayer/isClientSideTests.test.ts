import { TwoLayerCache } from '../../../cache/twoLayerServerlessAndSession';
import { CacheConfig } from '../../../types';
import {
  mockCacheConfig,
  setMockedGlobals,
  createLogStream,
  createLogger,
  setupErrorHandling,
} from '../../jest/default/logging';

describe('TwoLayer Cache - isClientSide', () => {
  let cache: TwoLayerCache;
  let config: CacheConfig;
  const logStream = createLogStream('isClientSideTests.log');
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

  it('should return true when running in a client-side environment', () => {
    log('Testing isClientSide in client-side environment');
    // Simulate client-side environment
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true,
    });

    expect(cache.isClientSide()).toBe(true);
  });

  it('should return false when running in a server-side environment', () => {
    log('Testing isClientSide in server-side environment');
    // Simulate server-side environment
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true,
    });

    expect(cache.isClientSide()).toBe(false);
  });

  it('should consistently return the same value for multiple calls', () => {
    log('Testing consistency of isClientSide');
    const firstCall = cache.isClientSide();
    const secondCall = cache.isClientSide();
    const thirdCall = cache.isClientSide();

    expect(secondCall).toBe(firstCall);
    expect(thirdCall).toBe(firstCall);
  });

  it('should return the correct value after environment changes', () => {
    log('Testing isClientSide after environment changes');
    // Start with client-side environment
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true,
    });

    const clientSideResult = cache.isClientSide();
    expect(clientSideResult).toBe(true);

    // Change to server-side environment
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true,
    });

    // Create a new cache instance to reflect the environment change
    const newCache = new TwoLayerCache(config);
    const serverSideResult = newCache.isClientSide();
    expect(serverSideResult).toBe(false);
  });
});
