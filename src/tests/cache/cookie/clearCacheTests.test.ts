import { jest } from '@jest/globals';
import { CacheResult, DataValue } from '../../../types';
import {
  MockCookieCache,
  default as mockCookieCacheInstance,
  defaultMockConfig,
} from '../../../jest/mocks/cache/client/cookie.mock';
import { runTestsWithLogging, closeLogStreams } from '../../../jest/reusableJest/logging';
import { setupErrorHandling } from '../../../jest/reusableJest/errorHandling';
import { measureAsyncExecutionTime } from '../../../jest/reusableJest/performance';

describe('CookieCache clear tests', () => {
  let cookieCache: MockCookieCache;
  let log: (message: string) => void = () => {};

  beforeAll(async () => {
    const logFunction = runTestsWithLogging('clearTests.log', 'cookie');
    log = await logFunction(0, 0, 0);
    setupErrorHandling(log);
    log('Starting tests');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    cookieCache = mockCookieCacheInstance(defaultMockConfig);
    log('Test setup complete');
  });

  afterAll(() => {
    closeLogStreams();
  });

  afterEach(() => {
    log('Test cleanup complete');
  });

  it('should clear all cache entries', async () => {
    log('Starting test: should clear all cache entries');
    const testData: DataValue = { type: 'string', value: 'test value' };
    const expirationDate = new Date(Date.now() + 1000 * 60 * 60);
    const executionTime = await measureAsyncExecutionTime(async () => {
      cookieCache.set('testId', 'testStore', testData, expirationDate);
      log('Test data set');
      cookieCache.clear();
      log('Cache cleared');
    });
    log(`Execution time: ${executionTime}ms`);
    const result = await new Promise<CacheResult | undefined>((resolve) => {
      cookieCache.get('testId', 'testStore', resolve);
    });
    expect(result).toBeUndefined();
    log('Verified cache entry is cleared');
  });

  it('should call clear method and reset internal cache', async () => {
    log('Starting test: should call clear method and reset internal cache');
    const executionTime = await measureAsyncExecutionTime(async () => {
      cookieCache.clear();
      log('Cache cleared');
    });
    log(`Execution time: ${executionTime}ms`);
    expect(cookieCache.clear).toHaveBeenCalled();
    expect(Object.keys(cookieCache['cache'])).toHaveLength(0);
    log('Verified internal cache is reset');
  });

  it('should notify subscribers about cleared data', async () => {
    log('Starting test: should notify subscribers about cleared data');
    const listener = jest.fn();
    const executionTime = await measureAsyncExecutionTime(async () => {
      const unsubscribe = cookieCache.subscribeToUpdates('testId', 'testStore', listener);
      cookieCache.clear();
      log('Cache cleared');
      unsubscribe();
    });
    log(`Execution time: ${executionTime}ms`);
    expect(listener).toHaveBeenCalledWith(undefined);
    log('Verified subscriber was notified about cleared data');
  });
});
